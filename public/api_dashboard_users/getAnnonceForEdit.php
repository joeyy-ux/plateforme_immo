<?php
/* =====================================================
   RÉCUPÉRER LES DONNÉES D'UNE ANNONCE POUR MODIFICATION
===================================================== */
session_start();

/* =====================================================
   HEADERS (CORS + JSON)
===================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit;
}

require '../../src/config_db.php';

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

/* =====================================================
   VALIDATION ID BIEN
===================================================== */

$id_bien = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id_bien <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de bien invalide'
    ]);
    exit;
}

/* =====================================================
   VÉRIFICATION PROPRIÉTÉ DU BIEN
===================================================== */

$stmt = $pdo->prepare("SELECT id_bien FROM information_generale WHERE id_bien = ? AND id_utilisateur = ?");
$stmt->execute([$id_bien, $id_utilisateur]);

if (!$stmt->fetch()) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Accès non autorisé à ce bien'
    ]);
    exit;
}

/* =====================================================
   RÉCUPÉRATION DES DONNÉES
===================================================== */

try {
    // Informations générales
    $stmt = $pdo->prepare("
        SELECT * FROM information_generale WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $infoGenerale = $stmt->fetch(PDO::FETCH_ASSOC);

    // Localisation
    $stmt = $pdo->prepare("
        SELECT * FROM localisation_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $localisation = $stmt->fetch(PDO::FETCH_ASSOC);

    // Caractéristiques intérieures
    $stmt = $pdo->prepare("
        SELECT titre, description FROM caracteristique_interieure WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $interieur = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Caractéristiques extérieures
    $stmt = $pdo->prepare("
        SELECT valeur FROM caracteristique_exterieure WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $exterieurDB = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Séparer les checkbox des autres pour caractéristiques extérieures
    $checkboxExterieur = [];
    $autresExterieur = [];
    $optionsExterieur = ["Parking", "Balcon", "Terrasse", "Jardin", "Garage"];

    foreach ($exterieurDB as $item) {
        if (in_array($item, $optionsExterieur)) {
            $checkboxExterieur[] = $item;
        } else {
            $autresExterieur[] = $item;
        }
    }

    // Documents
    $stmt = $pdo->prepare("
        SELECT nom_document FROM document_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $documents = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Accessibilité - Séparer checkbox des autres
    $stmt = $pdo->prepare("
        SELECT nom_accessibilite FROM accessibilite_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $accessibiliteDB = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $checkboxAccessibilite = [];
    $autresAccessibilite = [];
    $optionsAccessibilite = ["Accès PMR", "Ascenseur", "Rampe d'accès"];

    foreach ($accessibiliteDB as $item) {
        if (in_array($item, $optionsAccessibilite)) {
            $checkboxAccessibilite[] = $item;
        } else {
            $autresAccessibilite[] = $item;
        }
    }

    // Commodités - Séparer checkbox des autres
    $stmt = $pdo->prepare("
        SELECT nom_commodite FROM commodite_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $commoditesDB = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $checkboxCommodites = [];
    $autresCommodites = [];
    $optionsCommodites = ["Climatisation", "Chauffage", "Cuisine équipée", "Internet", "Télévision"];

    foreach ($commoditesDB as $item) {
        if (in_array($item, $optionsCommodites)) {
            $checkboxCommodites[] = $item;
        } else {
            $autresCommodites[] = $item;
        }
    }

    // Conditions de paiement
    $stmt = $pdo->prepare("
        SELECT condition_text FROM condition_paiement_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $conditionsPaiement = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Bonus
    $stmt = $pdo->prepare("
        SELECT bonus_text FROM bonus_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $bonus = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Médias - Photo principale
    $stmt = $pdo->prepare("
        SELECT chemin_photo FROM photo_principale_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $photoPrincipale = $stmt->fetch(PDO::FETCH_COLUMN);

    // Médias - Vidéo
    $stmt = $pdo->prepare("
        SELECT plateforme, lien_video FROM video_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $video = $stmt->fetch(PDO::FETCH_ASSOC);

    // Pièces et photos
    $stmt = $pdo->prepare("
        SELECT id_piece, nom_piece FROM piece_bien WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $piecesDB = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $pieces = [];
    $stmtPhotos = $pdo->prepare("
        SELECT chemin_photo FROM photo_piece WHERE id_piece = ?
    ");

    foreach ($piecesDB as $piece) {
        $stmtPhotos->execute([$piece['id_piece']]);
        $photos = $stmtPhotos->fetchAll(PDO::FETCH_COLUMN);

        $pieces[] = [
            'nom' => $piece['nom_piece'],
            'photos' => $photos
        ];
    }

    /* =====================================================
       CONSTRUCTION DE LA RÉPONSE AU FORMAT DU FORMULAIRE
    ===================================================== */

    $response = [
        'success' => true,
        'data' => [
            'informations_generales' => [
                'type_bien' => $infoGenerale['type_bien'],
                'type_offre' => $infoGenerale['type_offre'],
                'statut' => $infoGenerale['statut'],
                'meuble' => $infoGenerale['meuble'],
                'disponibilite' => $infoGenerale['disponibilite'],
                'surface' => $infoGenerale['surface'],
                'prix_bien' => $infoGenerale['prix_bien'],
                'frais_visite' => $infoGenerale['frais_visite'],
                'prix_visite' => $infoGenerale['prix_visite'],
                'titre' => $infoGenerale['titre'],
                'description' => $infoGenerale['description']
            ],
            'localisation' => [
                'ville' => $localisation['ville'],
                'commune' => $localisation['commune'],
                'quartier' => $localisation['quartier']
            ],
            'caracteristiques' => [
                'interieur' => array_map(function($item) {
                    return [
                        'titre' => $item['titre'],
                        'contenu' => $item['description']
                    ];
                }, $interieur),
                'exterieur' => $checkboxExterieur,
                'exterieur_autres' => $autresExterieur
            ],
            'documents' => $documents,
            'accessibilite' => [
                'liste' => $checkboxAccessibilite,
                'autres' => $autresAccessibilite
            ],
            'commodites' => [
                'liste' => $checkboxCommodites,
                'autres' => $autresCommodites
            ],
            'conditions_bonus' => [
                'conditions_paiement' => $conditionsPaiement,
                'bonus' => $bonus
            ],
            'medias' => [
                'photo_principale' => $photoPrincipale ?: null,
                'pieces' => $pieces,
                'video' => [
                    'platform' => $video['plateforme'] ?? '',
                    'url' => $video['lien_video'] ?? ''
                ]
            ]
        ]
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur lors de la récupération des données : ' . $e->getMessage()
    ]);
}
?>