<?php
/* =====================================================
   MODIFIER UNE ANNONCE
===================================================== */
session_start();

/* =====================================================
   HEADERS (CORS + JSON)
===================================================== */

// Réponse toujours en JSON
header('Content-Type: application/json; charset=utf-8');

// Autoriser le frontend (adapter si besoin)
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

// Méthodes autorisées
header('Access-Control-Allow-Methods: POST, OPTIONS');

// Headers autorisés
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Réponse immédiate pour la pré-requête OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =====================================================
   VÉRIFICATION MÉTHODE
===================================================== */

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Méthode non autorisée'
    ]);
    exit;
}

require '../../src/config_db.php'; // ajuste chemin si nécessaire

/* =====================================================
   AUTHENTIFICATION UTILISATEUR
===================================================== */

if (!isset($_SESSION['user']['id'])) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur non connecté']
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

// Récupérer les données JSON
// Supporter les deux cas : JSON brut (application/json) ou FormData contenant
// un champ 'data' avec le JSON (utilisé par le frontend lors d'envoi multipart)
$rawInput = file_get_contents('php://input');
$data = null;

if (isset($_POST['data'])) {
    $data = json_decode($_POST['data'], true);
} elseif (!empty($rawInput)) {
    $data = json_decode($rawInput, true);
}

if (!is_array($data)) {
    echo json_encode([
        'success' => false,
        'message' => 'Données JSON invalides'
    ]);
    exit;
}

// Récupérer l'ID du bien à modifier
$id_bien = $data['id_bien'] ?? null;

if (!$id_bien || !is_numeric($id_bien)) {
    echo json_encode([
        'success' => false,
        'message' => 'ID du bien manquant ou invalide'
    ]);
    exit;
}

// Vérifier que le bien appartient à l'utilisateur
try {
    $stmt = $pdo->prepare("SELECT id_bien FROM information_generale WHERE id_bien = ? AND id_utilisateur = ?");
    $stmt->execute([$id_bien, $id_utilisateur]);
    if (!$stmt->fetch()) {
        echo json_encode([
            'success' => false,
            'message' => 'Bien non trouvé ou accès non autorisé'
        ]);
        exit;
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de vérification du bien'
    ]);
    exit;
}

/* =====================================================
   INITIALISATION RÉPONSE
===================================================== */

$response = [
    'success' => false,
    'errors' => [],
    'message' => ''
];

/* =====================================================
   ÉTAPE 1 — INFORMATIONS GÉNÉRALES
===================================================== */

// Récupération sécurisée
$infos = $data['informations_generales'] ?? [];

// Fonctions utilitaires simples
function isEmpty($v) {
    return !isset($v) || trim($v) === '';
}

// Caractères interdits (même règle que le frontend)
$FORBIDDEN_CHARS_REGEX = '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

// Listes autorisées
$TYPES_BIEN  = ["Appartement", "Maison", "Terrain", "Bureau", "Boutique"];
$TYPES_OFFRE = ["Location", "Vente"];
$STATUTS     = ["Disponible", "Occupé"];
$MEUBLES     = ["Oui", "Non"];
$FRAIS_VISITE = ["Oui", "Non"];

/* =========================
   type_bien (obligatoire)
========================= */
if (isEmpty($infos['type_bien'] ?? null)) {
    $response['errors']['type_bien'] = "Type de bien obligatoire";
} elseif (!in_array($infos['type_bien'], $TYPES_BIEN, true)) {
    $response['errors']['type_bien'] = "Type de bien invalide";
}

/* =========================
   type_offre (obligatoire)
========================= */
if (isEmpty($infos['type_offre'] ?? null)) {
    $response['errors']['type_offre'] = "Type d’offre obligatoire";
} elseif (!in_array($infos['type_offre'], $TYPES_OFFRE, true)) {
    $response['errors']['type_offre'] = "Type d’offre invalide";
}

/* =========================
   Détection Terrain
========================= */
$isTerrain = ($infos['type_bien'] ?? '') === 'Terrain';

/* =========================
   statut / meuble / disponibilite
   (NON requis pour Terrain)
========================= */
if (!$isTerrain) {

    if (isEmpty($infos['statut'] ?? null)) {
        $response['errors']['statut'] = "Statut obligatoire";
    } elseif (!in_array($infos['statut'], $STATUTS, true)) {
        $response['errors']['statut'] = "Statut invalide";
    }

    if (isEmpty($infos['meuble'] ?? null)) {
        $response['errors']['meuble'] = "Information meublé obligatoire";
    } elseif (!in_array($infos['meuble'], $MEUBLES, true)) {
        $response['errors']['meuble'] = "Valeur meublé invalide";
    }

    if (isEmpty($infos['disponibilite'] ?? null)) {
        $response['errors']['disponibilite'] = "Disponibilité obligatoire";
    } elseif (preg_match($FORBIDDEN_CHARS_REGEX, $infos['disponibilite'])) {
        $response['errors']['disponibilite'] = "Caractères non autorisés";
    }
}

/* =========================
   surface
   - obligatoire pour Terrain
   - facultative sinon
========================= */
if ($isTerrain) {
    if (isEmpty($infos['surface'] ?? null)) {
        $response['errors']['surface'] = "Surface obligatoire pour un terrain";
    }
}

if (!isEmpty($infos['surface'] ?? null)) {
    if (!preg_match('/^[0-9a-zA-Z²\s]+$/', $infos['surface'])) {
        $response['errors']['surface'] =
            "Surface invalide (chiffres, lettres et m²)";
    }
}

/* =========================
   prix_bien (obligatoire)
   👉 on ne transforme PAS la valeur
========================= */
if (isEmpty($infos['prix_bien'] ?? null)) {
    $response['errors']['prix_bien'] = "Prix du bien obligatoire";
}

/* =========================
   frais_visite (obligatoire)
========================= */
if (isEmpty($infos['frais_visite'] ?? null)) {
    $response['errors']['frais_visite'] = "Information frais de visite obligatoire";
} elseif (!in_array($infos['frais_visite'], $FRAIS_VISITE, true)) {
    $response['errors']['frais_visite'] = "Valeur frais de visite invalide";
}

/* =========================
   prix_visite
   (obligatoire si frais_visite = Oui)
========================= */
if (($infos['frais_visite'] ?? '') === 'Oui') {
    if (isEmpty($infos['prix_visite'] ?? null)) {
        $response['errors']['prix_visite'] = "Prix de visite obligatoire";
    }
}

/* =========================
   titre (obligatoire)
========================= */
if (isEmpty($infos['titre'] ?? null)) {
    $response['errors']['titre'] = "Titre obligatoire";
} elseif (
    strlen($infos['titre']) < 2 ||
    strlen($infos['titre']) > 100
) {
    $response['errors']['titre'] = "Le titre doit contenir 2 à 100 caractères";
} elseif (preg_match($FORBIDDEN_CHARS_REGEX, $infos['titre'])) {
    $response['errors']['titre'] = "Caractères non autorisés dans le titre";
}

/* =========================
   description (obligatoire)
========================= */
if (isEmpty($infos['description'] ?? null)) {
    $response['errors']['description'] = "Description obligatoire";
} elseif (
    strlen($infos['description']) < 10 ||
    strlen($infos['description']) > 1000
) {
    $response['errors']['description'] =
        "La description doit contenir 10 à 1000 caractères";
} elseif (preg_match($FORBIDDEN_CHARS_REGEX, $infos['description'])) {
    $response['errors']['description'] =
        "Caractères non autorisés dans la description";
}

/* =========================
   FIN ÉTAPE 1 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 1;
    $response['message'] = "Veuillez corriger les erreurs de l'étape 1";
    echo json_encode($response);
    exit;
}

/*
👉 Si on arrive ici :
- l’étape 1 est VALIDE côté backend
- on pourra passer à l’étape 2
*/

/* =====================================================
   ÉTAPE 2 — LOCALISATION
===================================================== */

// Récupération sécurisée
$localisation = $data['localisation'] ?? [];

/* =========================
   Fonctions utilitaires
========================= */
function cleanValue($v) {
    return trim((string)$v);
}

/* =========================
   Règles de validation
========================= */

// Même regex que le frontend
$FORBIDDEN_CHARS_REGEX = '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

// Longueurs autorisées (plus larges, comme demandé)
$MIN_LEN = 2;
$MAX_LEN = 150;

/* =========================
   ville (obligatoire)
========================= */
$ville = cleanValue($localisation['ville'] ?? '');

if ($ville === '') {
    $response['errors']['ville'] = "La ville est obligatoire";
} elseif (preg_match($FORBIDDEN_CHARS_REGEX, $ville)) {
    $response['errors']['ville'] = "Caractères non autorisés dans la ville";
} elseif (strlen($ville) < $MIN_LEN || strlen($ville) > $MAX_LEN) {
    $response['errors']['ville'] =
        "La ville doit contenir entre $MIN_LEN et $MAX_LEN caractères";
}

/* =========================
   Détection Abidjan
========================= */
$isAbidjan = (mb_strtolower($ville) === 'abidjan');

/* =========================
   commune (obligatoire SI Abidjan)
========================= */
$commune = cleanValue($localisation['commune'] ?? '');

if ($isAbidjan) {
    if ($commune === '') {
        $response['errors']['commune'] =
            "La commune est obligatoire pour Abidjan";
    } elseif (preg_match($FORBIDDEN_CHARS_REGEX, $commune)) {
        $response['errors']['commune'] =
            "Caractères non autorisés dans la commune";
    } elseif (strlen($commune) < $MIN_LEN || strlen($commune) > $MAX_LEN) {
        $response['errors']['commune'] =
            "La commune doit contenir entre $MIN_LEN et $MAX_LEN caractères";
    }
}

/* =========================
   quartier (obligatoire)
========================= */
$quartier = cleanValue($localisation['quartier'] ?? '');

if ($quartier === '') {
    $response['errors']['quartier'] = "Le quartier est obligatoire";
} elseif (preg_match($FORBIDDEN_CHARS_REGEX, $quartier)) {
    $response['errors']['quartier'] =
        "Caractères non autorisés dans le quartier";
} elseif (strlen($quartier) < $MIN_LEN || strlen($quartier) > $MAX_LEN) {
    $response['errors']['quartier'] =
        "Le quartier doit contenir entre $MIN_LEN et $MAX_LEN caractères";
}

/* =========================
   FIN ÉTAPE 2 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 2;
    $response['message'] =
        "Veuillez corriger les erreurs de localisation";
    echo json_encode($response);
    exit;
}

/*
👉 Si on arrive ici :
- ville / commune / quartier sont valides
- on peut passer à l’étape 3
*/

/* =====================================================
   ÉTAPE 3 — CARACTÉRISTIQUES
===================================================== */

// Récupération sécurisée
$caracteristiques = $data['caracteristiques'] ?? [];

// Sous-parties sécurisées
$interieur = $caracteristiques['interieur'] ?? [];
$exterieur = $caracteristiques['exterieur'] ?? [];
$exterieur_autres = $caracteristiques['exterieur_autres'] ?? [];

/* =========================
   Fonctions utilitaires
========================= */
function cleanText($v) {
    return trim((string)$v);
}

// Même regex que le frontend
$FORBIDDEN_CHARS_REGEX = '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

// Longueurs autorisées
$MIN_LEN = 2;
$MAX_LEN = 150;

/* =========================
   CARACTÉRISTIQUES INTÉRIEURES
========================= */
/*
Structure attendue :
interieur = [
  { titre: "...", contenu: "..." },
  ...
]
*/
if (!is_array($interieur)) {
    $response['errors']['interieur'] =
        "Format des caractéristiques intérieures invalide";
} else {
    foreach ($interieur as $index => $item) {

        $titre = cleanText($item['titre'] ?? '');
        $contenu = cleanText($item['contenu'] ?? '');

        // Titre obligatoire
        if ($titre === '') {
            $response['errors']["interieur_$index"] =
                "Le titre de la caractéristique est obligatoire";
            continue;
        }

        if (preg_match($FORBIDDEN_CHARS_REGEX, $titre)) {
            $response['errors']["interieur_$index"] =
                "Caractères non autorisés dans le titre";
            continue;
        }

        if (strlen($titre) < $MIN_LEN || strlen($titre) > $MAX_LEN) {
            $response['errors']["interieur_$index"] =
                "Le titre doit contenir entre $MIN_LEN et $MAX_LEN caractères";
            continue;
        }

        // Contenu obligatoire
        if ($contenu === '') {
            $response['errors']["interieur_$index"] =
                "Le contenu de la caractéristique est obligatoire";
            continue;
        }

        if (preg_match($FORBIDDEN_CHARS_REGEX, $contenu)) {
            $response['errors']["interieur_$index"] =
                "Caractères non autorisés dans le contenu";
            continue;
        }

        if (strlen($contenu) < $MIN_LEN || strlen($contenu) > $MAX_LEN) {
            $response['errors']["interieur_$index"] =
                "Le contenu doit contenir entre $MIN_LEN et $MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   CARACTÉRISTIQUES EXTÉRIEURES (checkbox)
========================= */
/*
Structure attendue :
exterieur = ["Parking", "Balcon", ...]
*/
if (!is_array($exterieur)) {
    $response['errors']['exterieur'] =
        "Format des caractéristiques extérieures invalide";
} else {
    foreach ($exterieur as $item) {
        if (!is_string($item)) {
            $response['errors']['exterieur'] =
                "Valeur invalide dans les caractéristiques extérieures";
            break;
        }
    }
}

/* =========================
   AUTRES CARACTÉRISTIQUES EXTÉRIEURES
========================= */
/*
Structure attendue :
exterieur_autres = ["Texte libre", ...]
*/
if (!is_array($exterieur_autres)) {
    $response['errors']['exterieur_autres'] =
        "Format des autres caractéristiques invalide";
} else {
    foreach ($exterieur_autres as $index => $item) {

        $val = cleanText($item);

        if ($val === '') {
            $response['errors']["exterieur_autres_$index"] =
                "La caractéristique ne peut pas être vide";
            continue;
        }

        if (preg_match($FORBIDDEN_CHARS_REGEX, $val)) {
            $response['errors']["exterieur_autres_$index"] =
                "Caractères non autorisés";
            continue;
        }

        if (strlen($val) < $MIN_LEN || strlen($val) > $MAX_LEN) {
            $response['errors']["exterieur_autres_$index"] =
                "La caractéristique doit contenir entre $MIN_LEN et $MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   FIN ÉTAPE 3 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 3;
    $response['message'] =
        "Veuillez corriger les erreurs des caractéristiques";
    echo json_encode($response);
    exit;
}

/*
👉 Si on arrive ici :
- les caractéristiques sont valides
- on peut passer à l’étape 4
*/

/* =====================================================
   ÉTAPE 4 — DOCUMENTS
===================================================== */

// Récupération sécurisée
$documents = $data['documents'] ?? [];

/* =========================
   OUTILS
========================= */
function cleanDocument($text) {
    return trim((string)$text);
}

// Même regex que le frontend
$DOCUMENT_FORBIDDEN_REGEX =
    '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

$DOC_MIN_LEN = 2;
$DOC_MAX_LEN = 150;

/* =========================
   VALIDATION DOCUMENTS
========================= */
/*
Structure attendue :
documents = [
  "Plan cadastral",
  "Titre foncier",
  ...
]
*/
if (!is_array($documents)) {
    $response['errors']['documents'] =
        "Format des documents invalide";
} else {
    foreach ($documents as $index => $documentValue) {

        $documentValue = cleanDocument($documentValue);

        // Champ obligatoire si présent
        if ($documentValue === '') {
            $response['errors']["documents_$index"] =
                "Le nom du document est obligatoire";
            continue;
        }

        // Caractères interdits
        if (preg_match($DOCUMENT_FORBIDDEN_REGEX, $documentValue)) {
            $response['errors']["documents_$index"] =
                "Caractères non autorisés dans le document";
            continue;
        }

        // Longueur autorisée
        $len = mb_strlen($documentValue);
        if ($len < $DOC_MIN_LEN || $len > $DOC_MAX_LEN) {
            $response['errors']["documents_$index"] =
                "Le document doit contenir entre $DOC_MIN_LEN et $DOC_MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   FIN ÉTAPE 4 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 4;
    $response['message'] =
        "Veuillez corriger les erreurs dans les documents";
    echo json_encode($response);
    exit;
}

/* =====================================================
   ÉTAPE 5 — ACCESSIBILITÉ
===================================================== */

// Structure attendue depuis le frontend
/*
accessibilite = {
  liste: ["Accès PMR", "Ascenseur"],
  autres: ["Chemin sans marche"]
}
*/

$accessibilite = $data['accessibilite'] ?? [];

/* =========================
   SÉCURISATION STRUCTURE
========================= */
$accessibiliteListe  = $accessibilite['liste']  ?? [];
$accessibiliteAutres = $accessibilite['autres'] ?? [];

/* =========================
   RÈGLES DE VALIDATION
========================= */
$ACCESS_FORBIDDEN_REGEX =
    '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

$ACCESS_MIN_LEN = 2;
$ACCESS_MAX_LEN = 150;

/* =========================
   VALIDATION LISTE (CHECKBOX)
========================= */
if (!is_array($accessibiliteListe)) {
    $response['errors']['accessibilite_liste'] =
        "Format des options d’accessibilité invalide";
} else {
    foreach ($accessibiliteListe as $index => $labelAccess) {

        $labelAccess = trim((string)$labelAccess);

        if ($labelAccess === '') {
            $response['errors']["accessibilite_liste_$index"] =
                "Option d’accessibilité invalide";
            continue;
        }

        if (preg_match($ACCESS_FORBIDDEN_REGEX, $labelAccess)) {
            $response['errors']["accessibilite_liste_$index"] =
                "Caractères non autorisés dans l’accessibilité";
            continue;
        }
    }
}

/* =========================
   VALIDATION AUTRES ACCESSIBILITÉS (TEXTES)
========================= */
if (!is_array($accessibiliteAutres)) {
    $response['errors']['accessibilite_autres'] =
        "Format des autres accessibilités invalide";
} else {
    foreach ($accessibiliteAutres as $index => $autreAccess) {

        $autreAccess = trim((string)$autreAccess);

        // Champ obligatoire
        if ($autreAccess === '') {
            $response['errors']["accessibilite_autres_$index"] =
                "L’accessibilité est obligatoire";
            continue;
        }

        // Caractères interdits
        if (preg_match($ACCESS_FORBIDDEN_REGEX, $autreAccess)) {
            $response['errors']["accessibilite_autres_$index"] =
                "Caractères non autorisés dans l’accessibilité";
            continue;
        }

        // Longueur
        $length = mb_strlen($autreAccess);
        if ($length < $ACCESS_MIN_LEN || $length > $ACCESS_MAX_LEN) {
            $response['errors']["accessibilite_autres_$index"] =
                "L’accessibilité doit contenir entre $ACCESS_MIN_LEN et $ACCESS_MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   FIN ÉTAPE 5 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 5;
    $response['message'] =
        "Veuillez corriger les erreurs dans l’accessibilité";
    echo json_encode($response);
    exit;
}

/* =====================================================
   ÉTAPE 6 — COMMODITÉS
===================================================== */

/*
Structure attendue depuis le frontend :

commodites = {
  liste: ["Climatisation", "Cuisine équipée"],
  autres: ["Jacuzzi", "Sauna"]
}
*/

$commodites = $data['commodites'] ?? [];

/* =========================
   SÉCURISATION STRUCTURE
========================= */
$commoditesListe  = $commodites['liste']  ?? [];
$commoditesAutres = $commodites['autres'] ?? [];

/* =========================
   RÈGLES DE VALIDATION
========================= */
$COMMODITES_FORBIDDEN_REGEX =
    '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

$COMMODITES_MIN_LEN = 2;
$COMMODITES_MAX_LEN = 150;

/* =========================
   VALIDATION LISTE (CHECKBOX)
========================= */
if (!is_array($commoditesListe)) {
    $response['errors']['commodites_liste'] =
        "Format des commodités invalide";
} else {
    foreach ($commoditesListe as $index => $commoditeLabel) {

        $commoditeLabel = trim((string)$commoditeLabel);

        if ($commoditeLabel === '') {
            $response['errors']["commodites_liste_$index"] =
                "Commodité invalide";
            continue;
        }

        if (preg_match($COMMODITES_FORBIDDEN_REGEX, $commoditeLabel)) {
            $response['errors']["commodites_liste_$index"] =
                "Caractères non autorisés dans la commodité";
            continue;
        }
    }
}

/* =========================
   VALIDATION AUTRES COMMODITÉS (TEXTES)
========================= */
if (!is_array($commoditesAutres)) {
    $response['errors']['commodites_autres'] =
        "Format des autres commodités invalide";
} else {
    foreach ($commoditesAutres as $index => $autreCommodite) {

        $autreCommodite = trim((string)$autreCommodite);

        // Champ obligatoire
        if ($autreCommodite === '') {
            $response['errors']["commodites_autres_$index"] =
                "La commodité est obligatoire";
            continue;
        }

        // Caractères interdits
        if (preg_match($COMMODITES_FORBIDDEN_REGEX, $autreCommodite)) {
            $response['errors']["commodites_autres_$index"] =
                "Caractères non autorisés dans la commodité";
            continue;
        }

        // Longueur
        $length = mb_strlen($autreCommodite);
        if ($length < $COMMODITES_MIN_LEN || $length > $COMMODITES_MAX_LEN) {
            $response['errors']["commodites_autres_$index"] =
                "La commodité doit contenir entre $COMMODITES_MIN_LEN et $COMMODITES_MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   FIN ÉTAPE 6 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 6;
    $response['message'] =
        "Veuillez corriger les erreurs dans les commodités";
    echo json_encode($response);
    exit;
}

/* =====================================================
   ÉTAPE 7 — CONDITIONS DE PAIEMENT & BONUS
===================================================== */

/*
Structure reçue depuis le frontend :

conditions_bonus = {
  conditions_paiement: ["3 mois d’avance", "Caution obligatoire"],
  bonus: ["1 mois offert", "Frais réduits"]
}
*/

$conditionsBonus = $data['conditions_bonus'] ?? [];

/* =========================
   SÉCURISATION STRUCTURE
========================= */
$conditionsPaiement = $conditionsBonus['conditions_paiement'] ?? [];
$bonusListe         = $conditionsBonus['bonus'] ?? [];

/* =========================
   RÈGLES DE VALIDATION
========================= */
$CB_FORBIDDEN_REGEX =
    '/[~`•√π÷×§∆£¥$¢^°={}\\\\%©®™✓[\\]><!?@#,€]/';

$CB_MIN_LEN = 2;
$CB_MAX_LEN = 150;

/* =========================
   VALIDATION CONDITIONS DE PAIEMENT
========================= */
if (!is_array($conditionsPaiement)) {
    $response['errors']['conditions_paiement'] =
        "Format des conditions de paiement invalide";
} else {
    foreach ($conditionsPaiement as $index => $condition) {

        $condition = trim((string)$condition);

        // Champ obligatoire si présent
        if ($condition === '') {
            $response['errors']["conditions_paiement_$index"] =
                "La condition de paiement est obligatoire";
            continue;
        }

        // Caractères interdits
        if (preg_match($CB_FORBIDDEN_REGEX, $condition)) {
            $response['errors']["conditions_paiement_$index"] =
                "Caractères non autorisés dans la condition de paiement";
            continue;
        }

        // Longueur
        $length = mb_strlen($condition);
        if ($length < $CB_MIN_LEN || $length > $CB_MAX_LEN) {
            $response['errors']["conditions_paiement_$index"] =
                "La condition doit contenir entre $CB_MIN_LEN et $CB_MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   VALIDATION BONUS
========================= */
if (!is_array($bonusListe)) {
    $response['errors']['bonus'] =
        "Format des bonus invalide";
} else {
    foreach ($bonusListe as $index => $bonus) {

        $bonus = trim((string)$bonus);

        // Champ obligatoire si présent
        if ($bonus === '') {
            $response['errors']["bonus_$index"] =
                "Le bonus est obligatoire";
            continue;
        }

        // Caractères interdits
        if (preg_match($CB_FORBIDDEN_REGEX, $bonus)) {
            $response['errors']["bonus_$index"] =
                "Caractères non autorisés dans le bonus";
            continue;
        }

        // Longueur
        $length = mb_strlen($bonus);
        if ($length < $CB_MIN_LEN || $length > $CB_MAX_LEN) {
            $response['errors']["bonus_$index"] =
                "Le bonus doit contenir entre $CB_MIN_LEN et $CB_MAX_LEN caractères";
            continue;
        }
    }
}

/* =========================
   FIN ÉTAPE 7 — GESTION ERREURS
========================= */
if (!empty($response['errors'])) {
    $response['step'] = 7;
    $response['message'] =
        "Veuillez corriger les erreurs dans les conditions de paiement ou les bonus";
    echo json_encode($response);
    exit;
}

/* =====================================================
   ÉTAPE 8 — MÉDIAS (PHOTOS + VIDÉO)
   Pour la modification, on gère les nouveaux fichiers seulement
===================================================== */

/* =========================
   CONFIGURATION GLOBALE
========================= */

// Dossier racine des uploads
$UPLOAD_BASE_DIR = __DIR__ . '/../../uploads/publieBien';

// Sous-dossiers
$DIR_PHOTO_PRINCIPALE = $UPLOAD_BASE_DIR . '/photo_principale';
$DIR_PIECES_BASE      = $UPLOAD_BASE_DIR . '/pieces';

// Permissions sécurisées
$DIR_PERMISSION = 0755;

// Limites
$MAX_MAIN_PHOTO_SIZE = 5 * 1024 * 1024; // 5 Mo
$MAX_PHOTO_SIZE      = 5 * 1024 * 1024; // 5 Mo
$MAX_TOTAL_PHOTOS    = 150;

/* =========================
   CRÉATION DES DOSSIERS
========================= */

$directories = [
    $UPLOAD_BASE_DIR,
    $DIR_PHOTO_PRINCIPALE,
    $DIR_PIECES_BASE
];

foreach ($directories as $dir) {
    if (!is_dir($dir)) {
        if (!mkdir($dir, $DIR_PERMISSION, true)) {
            echo json_encode([
                'success' => false,
                'step' => 8,
                'message' => "Impossible de créer le dossier des médias"
            ]);
            exit;
        }
    }

    if (!is_writable($dir)) {
        echo json_encode([
            'success' => false,
            'step' => 8,
            'message' => "Le dossier $dir n’est pas accessible en écriture"
        ]);
        exit;
    }
}

/* =========================
   FONCTION : NETTOYER NOM DE DOSSIER
========================= */
function slugify($text)
{
    $text = strtolower($text);
    $text = preg_replace('/[^a-z0-9]+/i', '_', $text);
    return trim($text, '_');
}

/* =========================
   FONCTION : UPLOAD IMAGE SÉCURISÉ
========================= */
function uploadImageSecure(array $file, string $destinationDir, int $maxSize, string $relativePath)
{
    if ($file['error'] !== UPLOAD_ERR_OK) return false;
    if ($file['size'] > $maxSize) return false;

    // Vérification MIME réel
    $mime = mime_content_type($file['tmp_name']);
    if (!str_starts_with($mime, 'image/')) return false;

    // Extensions autorisées
    $extension = match ($mime) {
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        default      => null
    };

    if ($extension === null) return false;

    // Nom unique du fichier
    $filename = uniqid('img_', true) . '.' . $extension;
    $destination = rtrim($destinationDir, '/') . '/' . $filename;

    // Déplacement sécurisé
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        return false;
    }

    // Chemin RELATIF (pour BDD / frontend)
    return $relativePath . '/' . $filename;
}

/* =========================
   RÉCUPÉRATION DONNÉES
========================= */

$medias = $data['medias'] ?? [];
$pieces = $medias['pieces'] ?? [];
$video  = $medias['video']  ?? [];

/* =========================
   PHOTO PRINCIPALE (seulement si nouvelle)
========================= */

$photoPrincipalePath = null;

if (isset($_FILES['photo_principale'])) {

    $photoPrincipalePath = uploadImageSecure(
        $_FILES['photo_principale'],
        $DIR_PHOTO_PRINCIPALE,
        $MAX_MAIN_PHOTO_SIZE,
        'uploads/publieBien/photo_principale'
    );

    if ($photoPrincipalePath === false) {
        $response['errors']['photo_principale'] =
            "Photo principale invalide ou trop lourde";
    }
}

/* =========================
   PHOTOS PAR PIÈCE (seulement nouvelles pièces)
========================= */

$totalPhotos = 0;
$piecesSaved = [];

if (!is_array($pieces) || count($pieces) === 0) {
    $response['errors']['pieces'] =
        "Au moins une pièce avec des photos est requise";
}

foreach ($pieces as $index => $piece) {

    $pieceNomOriginal = trim((string)($piece['nom'] ?? ''));

    if ($pieceNomOriginal === '') {
        $response['errors']["pieces_{$index}_nom"] =
            "Le nom de la pièce est obligatoire";
        continue;
    }

    // Création du dossier de la pièce
    $pieceSlug = slugify($pieceNomOriginal);
    $pieceFolderName = 'piece_' . ($index + 1) . '_' . $pieceSlug;
    $pieceDir = $DIR_PIECES_BASE . '/' . $pieceFolderName;

    if (!is_dir($pieceDir)) {
        if (!mkdir($pieceDir, $DIR_PERMISSION, true)) {
            $response['errors']["pieces_{$index}_photos"] =
                "Impossible de créer le dossier de la pièce";
            continue;
        }
    }

    $inputName = "pieces_{$index}_photos";

    // Photos existantes envoyées depuis le frontend lors de la modification
    $existingPhotos = [];
    if (isset($piece['photos']) && is_array($piece['photos'])) {
        foreach ($piece['photos'] as $p) {
            if (is_string($p) && trim($p) !== '') $existingPhotos[] = $p;
        }
    }

    $savedPhotos = [];
    $newSavedPhotos = [];

    // Cas 1 : pas de fichiers uploadés pour cette pièce
    if (!isset($_FILES[$inputName]) || (isset($_FILES[$inputName]) && empty($_FILES[$inputName]['name'][0]))) {
        if (count($existingPhotos) === 0) {
            $response['errors']["pieces_{$index}_photos"] =
                "Ajoutez au moins une photo pour cette pièce";
            continue;
        }

        // On conserve uniquement les photos existantes
        $savedPhotos = $existingPhotos;
        $totalPhotos += count($existingPhotos);
        // Définir dossier à partir de la première photo existante si possible
        $pieceDossier = count($existingPhotos) ? pathinfo($existingPhotos[0], PATHINFO_DIRNAME) : ('uploads/publieBien/pieces/' . $pieceFolderName);

    } else {
        // Fichiers uploadés -> traitement habituel
        $photos = $_FILES[$inputName];

        for ($i = 0; $i < count($photos['name']); $i++) {

            $file = [
                'name'     => $photos['name'][$i],
                'type'     => $photos['type'][$i],
                'tmp_name' => $photos['tmp_name'][$i],
                'error'    => $photos['error'][$i],
                'size'     => $photos['size'][$i],
            ];

            $saved = uploadImageSecure(
                $file,
                $pieceDir,
                $MAX_PHOTO_SIZE,
                'uploads/publieBien/pieces/' . $pieceFolderName
            );

            if ($saved === false) {
                $response['errors']["pieces_{$index}_photos"] =
                    "Une photo est invalide dans cette pièce";
                break;
            }

            $newSavedPhotos[] = $saved;
            $totalPhotos++;
        }

        // Fusionner photos existantes + nouvelles
        $savedPhotos = array_merge($existingPhotos, $newSavedPhotos);
        $pieceDossier = 'uploads/publieBien/pieces/' . $pieceFolderName;
    }

    $piecesSaved[] = [
        'nom'    => $pieceNomOriginal,
        'dossier'=> $pieceDossier,
        'photos' => $savedPhotos
    ];
}

// Limite globale
if ($totalPhotos > $MAX_TOTAL_PHOTOS) {
    $response['errors']['photos_total'] =
        "Nombre total de photos supérieur à $MAX_TOTAL_PHOTOS";
}

/* =========================
   VIDÉO
========================= */

$videoPlatform = $video['platform'] ?? '';
$videoUrl = trim((string)($video['url'] ?? ''));

$platformsAutorisees = ['YouTube', 'TikTok', 'Vimeo'];

if ($videoPlatform === '') {
    $response['errors']['video_platform'] =
        "La plateforme vidéo est obligatoire";
} elseif (!in_array($videoPlatform, $platformsAutorisees, true)) {
    $response['errors']['video_platform'] =
        "Plateforme vidéo invalide";
}

if ($videoUrl === '') {
    $response['errors']['video_url'] =
        "Le lien de la vidéo est obligatoire";
} else {

    if ($videoPlatform === 'YouTube' &&
        !preg_match('/(youtube\.com|youtu\.be)/i', $videoUrl)) {
        $response['errors']['video_url'] = "Lien YouTube invalide";
    }

    if ($videoPlatform === 'TikTok' &&
        !preg_match('/tiktok\.com/i', $videoUrl)) {
        $response['errors']['video_url'] = "Lien TikTok invalide";
    }

    if ($videoPlatform === 'Vimeo' &&
        !preg_match('/vimeo\.com/i', $videoUrl)) {
        $response['errors']['video_url'] = "Lien Vimeo invalide";
    }
}

/* =========================
   FIN STEP 8 — GESTION ERREURS
========================= */

if (!empty($response['errors'])) {
    $response['step'] = 8;
    $response['message'] =
        "Veuillez corriger les erreurs dans les médias";
    echo json_encode($response);
    exit;
}

/*
À CE STADE :
✔ Toutes les validations sont passées
✔ $photoPrincipalePath si nouvelle photo
✔ $piecesSaved avec nouvelles pièces/photos
✔ $videoPlatform / $videoUrl valides

👉 Maintenant, on met à jour la BDD
*/

/* =====================================================
   MISE À JOUR DE LA BASE DE DONNÉES
===================================================== */

try {
    $pdo->beginTransaction();

    // Mise à jour information_generale
    $stmt = $pdo->prepare("
        UPDATE information_generale SET
            type_bien = ?, type_offre = ?, statut = ?, meuble = ?,
            disponibilite = ?, surface = ?, prix_bien = ?, frais_visite = ?,
            prix_visite = ?, titre = ?, description = ?
        WHERE id_bien = ? AND id_utilisateur = ?
    ");

    $stmt->execute([
        $infos['type_bien'],
        $infos['type_offre'],
        $infos['statut'] ?? 'Non applicable',
        $infos['meuble'] ?? 'Non applicable',
        $infos['disponibilite'] ?? 'Non applicable',
        $infos['surface'] ?? null,
        $infos['prix_bien'],
        $infos['frais_visite'],
        $infos['prix_visite'] ?? null,
        $infos['titre'],
        $infos['description'],
        $id_bien,
        $id_utilisateur
    ]);

    // Mise à jour localisation_bien
    $stmt = $pdo->prepare("
        UPDATE localisation_bien SET
            ville = ?, commune = ?, quartier = ?
        WHERE id_bien = ?
    ");

    $stmt->execute([
        $localisation['ville'],
        $localisation['commune'] ?? null,
        $localisation['quartier'],
        $id_bien
    ]);

    // Supprimer et recréer les caractéristiques intérieures
    $stmt = $pdo->prepare("DELETE FROM caracteristique_interieure WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO caracteristique_interieure (id_bien, titre, description)
        VALUES (?, ?, ?)
    ");

    foreach ($interieur as $item) {
        $stmt->execute([
            $id_bien,
            $item['titre'],
            $item['contenu']
        ]);
    }

    // Supprimer et recréer les caractéristiques extérieures
    $stmt = $pdo->prepare("DELETE FROM caracteristique_exterieure WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO caracteristique_exterieure (id_bien, valeur)
        VALUES (?, ?)
    ");

    foreach (array_merge($exterieur, $exterieur_autres) as $item) {
        $stmt->execute([$id_bien, $item]);
    }

    // Supprimer et recréer les documents
    $stmt = $pdo->prepare("DELETE FROM document_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO document_bien (id_bien, nom_document)
        VALUES (?, ?)
    ");

    foreach ($documents as $document) {
        $stmt->execute([$id_bien, $document]);
    }

    // Supprimer et recréer l'accessibilité
    $stmt = $pdo->prepare("DELETE FROM accessibilite_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO accessibilite_bien (id_bien, nom_accessibilite)
        VALUES (?, ?)
    ");

    foreach (array_merge($accessibiliteListe, $accessibiliteAutres) as $item) {
        $stmt->execute([$id_bien, $item]);
    }

    // Supprimer et recréer les commodités
    $stmt = $pdo->prepare("DELETE FROM commodite_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO commodite_bien (id_bien, nom_commodite)
        VALUES (?, ?)
    ");

    foreach (array_merge($commoditesListe, $commoditesAutres) as $item) {
        $stmt->execute([$id_bien, $item]);
    }

    // Supprimer et recréer les conditions de paiement et bonus
    $stmt = $pdo->prepare("DELETE FROM condition_paiement_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO condition_paiement_bien (id_bien, condition_text)
        VALUES (?, ?)
    ");

    foreach ($conditionsPaiement as $condition) {
        $stmt->execute([$id_bien, $condition]);
    }

    $stmt = $pdo->prepare("DELETE FROM bonus_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    $stmt = $pdo->prepare("
        INSERT INTO bonus_bien (id_bien, bonus_text)
        VALUES (?, ?)
    ");

    foreach ($bonusListe as $bonus) {
        $stmt->execute([$id_bien, $bonus]);
    }

    // Mise à jour photo principale si nouvelle
    if ($photoPrincipalePath) {
        // Supprimer l'ancienne photo principale
        $stmt = $pdo->prepare("DELETE FROM photo_principale_bien WHERE id_bien = ?");
        $stmt->execute([$id_bien]);

        // Insérer la nouvelle
        $stmt = $pdo->prepare("
            INSERT INTO photo_principale_bien (id_bien, chemin_photo)
            VALUES (?, ?)
        ");
        $stmt->execute([$id_bien, $photoPrincipalePath]);
    }

    // Supprimer et recréer les pièces/photos si nouvelles
    if (!empty($piecesSaved)) {
        // Supprimer les anciennes pièces (les photos seront supprimées en cascade)
        $stmt = $pdo->prepare("DELETE FROM piece_bien WHERE id_bien = ?");
        $stmt->execute([$id_bien]);

        // Insérer les nouvelles pièces
        $stmt = $pdo->prepare("
            INSERT INTO piece_bien (id_bien, nom_piece)
            VALUES (?, ?)
        ");

        foreach ($piecesSaved as $piece) {
            $stmt->execute([
                $id_bien,
                $piece['nom']
            ]);

            $id_piece = $pdo->lastInsertId();

            // Insérer les photos de la pièce
            $stmtPhoto = $pdo->prepare("
                INSERT INTO photo_piece (id_piece, chemin_photo)
                VALUES (?, ?)
            ");

            foreach ($piece['photos'] as $photo) {
                $stmtPhoto->execute([$id_piece, $photo]);
            }
        }
    }

    // Mise à jour vidéo
    // Supprimer l'ancienne vidéo
    $stmt = $pdo->prepare("DELETE FROM video_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    // Insérer la nouvelle vidéo
    $stmt = $pdo->prepare("
        INSERT INTO video_bien (id_bien, plateforme, lien_video)
        VALUES (?, ?, ?)
    ");
    $stmt->execute([$id_bien, $videoPlatform, $videoUrl]);

    $pdo->commit();

    $response['success'] = true;
    $response['message'] = "Annonce modifiée avec succès";

} catch (Exception $e) {
    $pdo->rollBack();
    $response['success'] = false;
    $response['message'] = "Erreur lors de la modification : " . $e->getMessage();
}

echo json_encode($response);
?>