<?php
session_start();

/* ==========================================================
   HEADERS API - SUPPRESSION BIEN
========================================================== */
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

/* ==========================================================
   SESSION UTILISATEUR - VÉRIFICATION CONNEXION
========================================================== */
if (!isset($_SESSION['user']['id'])) {
    echo json_encode([
        'success' => false,
        'erreur' => 'Utilisateur non connecté'
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

/* ==========================================================
   INPUT VALIDATION - RÉCUPÉRATION DONNÉES POST
========================================================== */
// Gestion des données JSON ou POST traditionnelles
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = strpos($contentType, 'application/json') !== false;

if ($isJson) {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    $id_bien = (int) ($data['id_bien'] ?? 0);
    $motif = trim($data['motif'] ?? '');
} else {
    $id_bien = (int) ($_POST['id_bien'] ?? 0);
    $motif = trim($_POST['motif'] ?? '');
}

// DEBUG: Log des données reçues
error_log("DEBUG - Content-Type: " . $contentType);
error_log("DEBUG - Is JSON: " . ($isJson ? 'true' : 'false'));
error_log("DEBUG - Raw input: " . file_get_contents('php://input'));
error_log("DEBUG - POST data: " . print_r($_POST, true));
error_log("DEBUG - id_bien: " . $id_bien);
error_log("DEBUG - motif: '" . $motif . "'");

$errors = [];

// Validation ID bien
if ($id_bien <= 0) {
    $errors['id_bien'] = 'ID du bien invalide';
}

// Validation motif
if ($motif === '') {
    $errors['motif'] = 'Le motif de suppression est obligatoire';
} elseif (strlen($motif) < 10) {
    $errors['motif'] = 'Motif trop court (minimum 10 caractères)';
} elseif (strlen($motif) > 500) {
    $errors['motif'] = 'Motif trop long (maximum 500 caractères)';
} elseif (!preg_match("/^[a-zA-ZÀ-ÿ0-9\s.,;:!?()'\"-]+$/u", $motif)) {
    $errors['motif'] = 'Caractères non autorisés dans le motif';
}

if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreurs de validation',
        'details' => $errors
    ]);
    exit;
}



/* ==========================================================
   VÉRIFICATION PROPRIÉTÉ DU BIEN
========================================================== */
try {
    $stmt = $pdo->prepare("
        SELECT id_bien FROM information_generale
        WHERE id_bien = ? AND id_utilisateur = ?
    ");
    $stmt->execute([$id_bien, $id_utilisateur]);
    $bien = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$bien) {
        echo json_encode([
            'success' => false,
            'erreur' => 'Bien non trouvé ou vous n\'êtes pas le propriétaire'
        ]);
        exit;
    }
} catch (PDOException $e) {
    error_log("Erreur vérification propriété: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de la vérification du bien'
    ]);
    exit;
}

/* ==========================================================
   PHASE 1: RÉCUPÉRATION DES DONNÉES PRINCIPALES UNIQUEMENT
========================================================== */
$donnees_archive = [];

try {
    // Récupération informations générales uniquement
    $stmt = $pdo->prepare("
        SELECT * FROM information_generale
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $info_generale = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$info_generale) {
        echo json_encode([
            'success' => false,
            'erreur' => 'Informations générales du bien introuvables'
        ]);
        exit;
    }

    $donnees_archive['info_generale'] = $info_generale;

    // Récupération photo principale uniquement
    $stmt = $pdo->prepare("
        SELECT chemin_photo FROM photo_principale_bien
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $photo_principale = $stmt->fetch(PDO::FETCH_ASSOC);
    $donnees_archive['photo_principale'] = $photo_principale ? $photo_principale['chemin_photo'] : null;

} catch (PDOException $e) {
    error_log("Erreur récupération données principales: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de la récupération des données principales du bien'
    ]);
    exit;
}

/* ==========================================================
   PHASE 2: CRÉATION DOSSIER HISTORIQUE ET COPIE PHOTO
========================================================== */

// Créer le dossier historique_bien s'il n'existe pas
$historique_dir = '../../uploads/historique_bien/';
if (!is_dir($historique_dir)) {
    mkdir($historique_dir, 0755, true);
}

// Copier la photo principale dans le dossier historique si elle existe
$photo_historique = null;
if ($donnees_archive['photo_principale']) {
    // Construction du chemin source : si le chemin commence par 'uploads/', on l'utilise tel quel depuis la racine
    if (strpos($donnees_archive['photo_principale'], 'uploads/') === 0) {
        $source_path = '../../' . $donnees_archive['photo_principale'];
    } else {
        $source_path = '../../uploads/publieBien/photo_principale/' . $donnees_archive['photo_principale'];
    }
    
    $destination_path = $historique_dir . 'bien_' . $id_bien . '_photo_' . time() . '_' . basename($donnees_archive['photo_principale']);
    
    error_log("DEBUG - Chemin source: " . $source_path);
    error_log("DEBUG - Chemin destination: " . $destination_path);
    error_log("DEBUG - Fichier existe: " . (file_exists($source_path) ? 'OUI' : 'NON'));
    
    if (file_exists($source_path)) {
        if (copy($source_path, $destination_path)) {
            $photo_historique = basename($destination_path);
        } else {
            error_log("Erreur copie photo principale: " . $source_path . " vers " . $destination_path);
            echo json_encode([
                'success' => false,
                'erreur' => 'Erreur lors de la sauvegarde de la photo principale dans l\'historique'
            ]);
            exit;
        }
    } else {
        error_log("Photo principale introuvable: " . $source_path);
        echo json_encode([
            'success' => false,
            'erreur' => 'Photo principale du bien introuvable'
        ]);
        exit;
    }
}

/* ==========================================================
   PHASE 3: INSERTION DANS HISTORIQUE_BIEN
========================================================== */
try {
    $stmt = $pdo->prepare("
        INSERT INTO historique_bien (
            id_bien, id_utilisateur, type_bien, type_offre, statut, meuble,
            disponibilite, surface, prix_bien, frais_visite, prix_visite,
            titre, description, statut_bien, date_publication, photo_principale, motif
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'supprimer', ?, ?, ?
        )
    ");

    $stmt->execute([
        $donnees_archive['info_generale']['id_bien'],
        $donnees_archive['info_generale']['id_utilisateur'],
        $donnees_archive['info_generale']['type_bien'],
        $donnees_archive['info_generale']['type_offre'],
        $donnees_archive['info_generale']['statut'],
        $donnees_archive['info_generale']['meuble'],
        $donnees_archive['info_generale']['disponibilite'],
        $donnees_archive['info_generale']['surface'],
        $donnees_archive['info_generale']['prix_bien'],
        $donnees_archive['info_generale']['frais_visite'],
        $donnees_archive['info_generale']['prix_visite'],
        $donnees_archive['info_generale']['titre'],
        $donnees_archive['info_generale']['description'],
        $donnees_archive['info_generale']['date_publication'],
        $photo_historique, // Nouveau chemin dans le dossier historique
        $motif
    ]);

} catch (PDOException $e) {
    error_log("Erreur insertion historique: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de l\'archivage du bien'
    ]);
    exit;
}

/* ==========================================================
   PHASE 4: SUPPRESSION DE TOUS LES FICHIERS PHYSIQUES
========================================================== */

// Fonction utilitaire pour supprimer un fichier de manière sécurisée
function supprimerFichier($chemin) {
    if ($chemin && file_exists($chemin)) {
        return unlink($chemin);
    }
    return true; // Si le fichier n'existe pas, on considère que c'est ok
}

// Fonction utilitaire pour supprimer un dossier récursivement
function supprimerDossierRecursif($dossier) {
    if (!is_dir($dossier)) {
        return true;
    }
    
    $elements = scandir($dossier);
    foreach ($elements as $element) {
        if ($element != "." && $element != "..") {
            $chemin_element = $dossier . DIRECTORY_SEPARATOR . $element;
            if (is_dir($chemin_element)) {
                supprimerDossierRecursif($chemin_element);
            } else {
                unlink($chemin_element);
            }
        }
    }
    return rmdir($dossier);
}

// Chemin de base pour les uploads
$base_path = '../../uploads/';

// Suppression photo principale originale (celle qui était dans publieBien)
if ($donnees_archive['photo_principale']) {
    if (strpos($donnees_archive['photo_principale'], 'uploads/') === 0) {
        supprimerFichier('../../' . $donnees_archive['photo_principale']);
    } else {
        supprimerFichier($base_path . 'publieBien/photo_principale/' . $donnees_archive['photo_principale']);
    }
}

// Récupération et suppression de toutes les photos des pièces
try {
    $stmt = $pdo->prepare("
        SELECT pp.chemin_photo
        FROM photo_piece pp
        INNER JOIN piece_bien pb ON pp.id_piece = pb.id_piece
        WHERE pb.id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $photos_pieces = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Extraire les dossiers uniques des pièces depuis les chemins des photos
    $dossiers_pieces = [];
    foreach ($photos_pieces as $photo) {
        // Le chemin est comme "uploads/publieBien/pieces/piece_1_slug/img.jpg"
        // On veut extraire "uploads/publieBien/pieces/piece_1_slug"
        if (preg_match('#^(.+)/[^/]+$#', $photo, $matches)) {
            $dossier_piece = $matches[1];
            $dossiers_pieces[$dossier_piece] = true; // Utiliser comme clé pour unicité
        }
    }

    // Supprimer les dossiers des pièces entiers
    foreach (array_keys($dossiers_pieces) as $dossier_piece) {
        $chemin_dossier_complet = '../../' . $dossier_piece;
        if (is_dir($chemin_dossier_complet)) {
            supprimerDossierRecursif($chemin_dossier_complet);
        }
    }

} catch (PDOException $e) {
    error_log("Erreur suppression fichiers pièces: " . $e->getMessage());
    // On continue quand même, ce n'est pas bloquant
}

/* ==========================================================
   PHASE 5: SUPPRESSION DE TOUTES LES DONNÉES EN BASE
========================================================== */
try {
    // Démarrage d'une transaction pour assurer l'intégrité
    $pdo->beginTransaction();

    // Suppression de TOUTES les tables liées dans l'ordre inverse des dépendances
    // Les contraintes FOREIGN KEY feront le cascade automatique

    // 1. Suppression des photos de pièces (sera supprimé automatiquement via FK)
    $stmt = $pdo->prepare("DELETE FROM photo_piece WHERE id_piece IN (SELECT id_piece FROM piece_bien WHERE id_bien = ?)");
    $stmt->execute([$id_bien]);

    // 2. Suppression des pièces
    $stmt = $pdo->prepare("DELETE FROM piece_bien WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    // 3. Suppression de toutes les autres tables liées
    $tables_a_supprimer = [
        'video_bien',
        'photo_principale_bien',
        'bonus_bien',
        'condition_paiement_bien',
        'commodite_bien',
        'accessibilite_bien',
        'document_bien',
        'caracteristique_exterieure',
        'caracteristique_interieure',
        'localisation_bien'
    ];

    foreach ($tables_a_supprimer as $table) {
        $stmt = $pdo->prepare("DELETE FROM $table WHERE id_bien = ?");
        $stmt->execute([$id_bien]);
    }

    // 4. Suppression finale des informations générales (cascade supprimera automatiquement)
    $stmt = $pdo->prepare("DELETE FROM information_generale WHERE id_bien = ?");
    $stmt->execute([$id_bien]);

    // Validation de la transaction
    $pdo->commit();

} catch (PDOException $e) {
    // En cas d'erreur, annulation de toutes les suppressions
    $pdo->rollBack();
    error_log("Erreur suppression données: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de la suppression des données du bien'
    ]);
    exit;
}

/* ==========================================================
   PHASE 6: RÉPONSE DE SUCCÈS
========================================================== */
echo json_encode([
    'success' => true,
    'message' => 'Le bien a été supprimé avec succès et archivé dans l\'historique',
    'id_bien_supprime' => $id_bien,
    'photo_archivee' => $photo_historique ? '../../uploads/historique_bien/' . $photo_historique : null
]);

?>