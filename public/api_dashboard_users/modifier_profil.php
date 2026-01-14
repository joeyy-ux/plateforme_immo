<?php
session_start();

/* ==========================================================
   HEADERS API
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
   SESSION UTILISATEUR
========================================================== */
if (!isset($_SESSION['user']['id'])) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur non connecté']
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];
$BASE_URL = 'http://localhost/plateforme_immobiliere/uploads/';

/* ==========================================================
   RÉCUPÉRATION TYPE DE COMPTE
========================================================== */
$stmt = $pdo->prepare(
    "SELECT type_compte FROM utilisateur WHERE id_utilisateur = ? LIMIT 1"
);
$stmt->execute([$id_utilisateur]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur introuvable']
    ]);
    exit;
}

$type_compte = $user['type_compte'];

/* ==========================================================
   INPUTS (ALIGNÉS AVEC LE FRONTEND)
========================================================== */
$nom_prenom      = trim($_POST['nom_prenom'] ?? '');
$nom_agence      = trim($_POST['nom_agence'] ?? '');
$numero          = trim($_POST['numero'] ?? '');
$adresse         = trim($_POST['adresse'] ?? '');
$description     = trim($_POST['description'] ?? '');
$statut          = trim($_POST['statut'] ?? '');
$fonction        = trim($_POST['fonction'] ?? '');
$numero_fonction = trim($_POST['numero_fonction'] ?? '');
$photo           = $_FILES['photo'] ?? null;

$errors = [];

/* ==========================================================
   VALIDATIONS (ERREURS PAR CHAMP)
========================================================== */

/* --- Nom & prénom --- */
if ($nom_prenom && !preg_match("/^[A-Za-zÀ-ÿ\s]{2,100}$/u", $nom_prenom)) {
    $errors['nom_prenom'] = 'Nom & prénom invalide';
}

/* --- Nom agence --- */
if ($nom_agence && !preg_match("/^[A-Za-zÀ-ÿ0-9\s.,'-]{2,100}$/u", $nom_agence)) {
    $errors['nom_agence'] = 'Nom d’agence invalide';
}

/* --- Numéro principal --- */
if ($numero) {
    $digits = preg_replace('/\D+/', '', $numero);
    if (strlen($digits) < 8 || strlen($digits) > 15) {
        $errors['numero'] = 'Numéro invalide';
    }
}

/* --- Adresse --- */
if ($adresse && (strlen($adresse) < 5 || strlen($adresse) > 100)) {
    $errors['adresse'] = 'Adresse invalide';
}

/* --- Description --- */
if ($description && (strlen($description) < 20 || strlen($description) > 500)) {
    $errors['description'] = 'La description doit contenir entre 20 et 500 caractères';
}

/* --- Statut (démarcheur uniquement) --- */
$validStatuts = ['independant', 'rattache', 'proprietaire'];
if ($statut && !in_array($statut, $validStatuts, true)) {
    $errors['statut'] = 'Statut invalide';
}

/* ==========================================================
   VALIDATION PHOTO (SANS UPLOAD IMMÉDIAT)
========================================================== */
$photoName = null;

if ($photo && $photo['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!in_array($photo['type'], $allowedTypes, true)) {
        $errors['photo'] = 'Format image invalide';
    } elseif ($photo['size'] > 2 * 1024 * 1024) {
        $errors['photo'] = 'Image trop lourde (max 2 Mo)';
    }
}

/* ==========================================================
   SI ERREURS → STOP (FRONTEND = BORDURE ROUGE)
========================================================== */
if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

/* ==========================================================
   PRÉPARATION UPLOAD (APRÈS VALIDATION)
========================================================== */
// Prepare photo filename and upload directory (store in project-root uploads/completerProfil)
// modifier_profil.php is in public/api_dashboard_users; project root is two levels up
if ($photo && $photo['error'] === UPLOAD_ERR_OK) {
    $ext = strtolower(pathinfo($photo['name'], PATHINFO_EXTENSION));
    // real filename stored on disk
    $photoFileName = 'logo_' . $id_utilisateur . '_' . time() . '.' . $ext;
    // DB should store relative path like 'completerProfil/photo_...'
    $photoDbPath = 'completerProfil/' . $photoFileName;

    // point to c:/xampp/htdocs/plateforme_immobiliere/uploads/completerProfil/
    $uploadDir = __DIR__ . '/../../uploads/completerProfil/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
}

/* ==========================================================
   TRANSACTION
========================================================== */
try {
    $pdo->beginTransaction();

    // Fetch previous photo filename for this user (to delete after successful update)
    $oldPhoto = null;
    if ($type_compte === 'demarcheur') {
        $s = $pdo->prepare("SELECT photo_image FROM profil_demarcheur WHERE id_utilisateur = ? LIMIT 1");
        $s->execute([$id_utilisateur]);
        $r = $s->fetch(PDO::FETCH_ASSOC);
        if ($r && !empty($r['photo_image'])) $oldPhoto = $r['photo_image'];
    } elseif ($type_compte === 'proprietaire') {
        $s = $pdo->prepare("SELECT photo_image FROM profil_proprio WHERE id_utilisateur = ? LIMIT 1");
        $s->execute([$id_utilisateur]);
        $r = $s->fetch(PDO::FETCH_ASSOC);
        if ($r && !empty($r['photo_image'])) $oldPhoto = $r['photo_image'];
    } elseif ($type_compte === 'agence') {
        $s = $pdo->prepare("SELECT logo_agence FROM profil_agence WHERE id_utilisateur = ? LIMIT 1");
        $s->execute([$id_utilisateur]);
        $r = $s->fetch(PDO::FETCH_ASSOC);
        if ($r && !empty($r['logo_agence'])) $oldPhoto = $r['logo_agence'];
    }

    /* --- TABLE UTILISATEUR ---
       Only update the relevant fields depending on account type.
       Use COALESCE(NULLIF(...)) so empty strings won't overwrite existing values.
    */
    if ($type_compte === 'agence') {
        $pdo->prepare(
            "UPDATE utilisateur SET
                nom_agence = COALESCE(NULLIF(?, ''), nom_agence),
                numero = COALESCE(NULLIF(?, ''), numero)
            WHERE id_utilisateur = ?"
        )->execute([
            $nom_agence,
            $numero,
            $id_utilisateur
        ]);
    } else {
        // non-agence accounts: update nom_prenom and numero
        $pdo->prepare(
            "UPDATE utilisateur SET
                nom_prenom = COALESCE(NULLIF(?, ''), nom_prenom),
                numero = COALESCE(NULLIF(?, ''), numero)
            WHERE id_utilisateur = ?"
        )->execute([
            $nom_prenom,
            $numero,
            $id_utilisateur
        ]);
    }

    /* --- AGENCE --- */
    if ($type_compte === 'agence') {
        // Agency profile: update headquarters address, description and optionally logo
        $pdo->prepare(
            "UPDATE profil_agence SET
                adresse_siege = COALESCE(NULLIF(?, ''), adresse_siege),
                description_agence = COALESCE(NULLIF(?, ''), description_agence),
                    logo_agence = COALESCE(?, logo_agence)
            WHERE id_utilisateur = ?"
        )->execute([
            $adresse,
                $description,
                ($photoDbPath ?? null),
            $id_utilisateur
        ]);
    }

    /* --- DEMARCHEUR --- */
    if ($type_compte === 'demarcheur') {
        // Demarcheur profile: update personal address, statut, contact name/phone, description and photo
        $pdo->prepare(
            "UPDATE profil_demarcheur SET
                adresse_personnelle = COALESCE(NULLIF(?, ''), adresse_personnelle),
                statut = COALESCE(NULLIF(?, ''), statut),
                nom_contact = COALESCE(NULLIF(?, ''), nom_contact),
                contact_telephone = COALESCE(NULLIF(?, ''), contact_telephone),
                description_demarcheur = COALESCE(NULLIF(?, ''), description_demarcheur),
                    photo_image = COALESCE(?, photo_image)
            WHERE id_utilisateur = ?"
        )->execute([
            $adresse,
            $statut,
            $fonction,
            $numero_fonction,
            $description,
                ($photoDbPath ?? null),
            $id_utilisateur
        ]);
    }

    /* --- PROPRIÉTAIRE --- */
    if ($type_compte === 'proprietaire') {
        // Proprietor profile: update personal address, description and photo
        $pdo->prepare(
            "UPDATE profil_proprio SET
                adresse_personnelle = COALESCE(NULLIF(?, ''), adresse_personnelle),
                description_proprio = COALESCE(NULLIF(?, ''), description_proprio),
                    photo_image = COALESCE(?, photo_image)
            WHERE id_utilisateur = ?"
        )->execute([
            $adresse,
            $description,
                ($photoDbPath ?? null),
            $id_utilisateur
        ]);
    }

    // Commit DB changes first
    $pdo->commit();

    // After successful commit, move uploaded file (if any) and delete old photo when replaced
    if (isset($photoFileName) && isset($uploadDir) && is_dir($uploadDir)) {
        $moved = move_uploaded_file($photo['tmp_name'], $uploadDir . $photoFileName);
        if ($moved) {
            // If there was a previous photo and it's not the same as the new one, delete it
            if ($oldPhoto) {
                // $oldPhoto may contain 'completerProfil/filename' or just filename; normalize
                $oldBase = basename($oldPhoto);
                if ($oldBase && $oldBase !== $photoFileName) {
                    $oldPath = $uploadDir . $oldBase;
                    if (is_file($oldPath)) {
                        @unlink($oldPath);
                    }
                }
            }
        }
    }

    // Return success and new photo url when applicable
    echo json_encode([
        'success' => true,
        'message' => 'Vos informations ont été mises à jour avec succès.',
        // returned url mirrors DB storage structure
        'photo_url' => isset($photoDbPath) ? $BASE_URL . 'uploads/' . $photoDbPath : null
    ]);
} catch (Exception $e) {
    $pdo->rollBack();

    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Erreur serveur']
    ]);
}
exit;
