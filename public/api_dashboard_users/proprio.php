<?php
session_start();

// --------------------
//  CORS (dev: adjust in production)
// --------------------
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php'; // ajuste chemin si nécessaire

// --------------------
//  Vérifier session
// --------------------
if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Utilisateur non connecté']]);
    exit;
}

$id_utilisateur = $_SESSION['user']['id'];
$errors = [];
$uploadedFiles = [];

// --------------------
//  POST handling
// --------------------
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $adresse = trim($_POST['adresse'] ?? '');
    $description = trim($_POST['description'] ?? '');

    // validation texte
    if ($adresse === "") {
        $errors['adresse'] = "L'adresse est obligatoire.";
    } elseif (strlen($adresse) < 5) {
        $errors['adresse'] = "Adresse trop courte.";
    } elseif (strlen($adresse) > 100) {
        $errors['adresse'] = "Adresse trop longue.";
    }

    if ($description === "") {
        $errors['description'] = "Description obligatoire.";
    } elseif (strlen($description) < 20) {
        $errors['description'] = "Description trop courte (min 20).";
    } elseif (strlen($description) > 500) {
        $errors['description'] = "Description trop longue (max 500).";
    }

    // uploads
    $uploadDir = __DIR__ . '/../../uploads/completerProfil/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    $fileKeys = [
        "photoLogo" => "",
        "pieceRecto" => "",
        "pieceVerso" => "",
        "selfie" => ""
    ];

    foreach ($fileKeys as $key => &$path) {

        if (!isset($_FILES[$key]) || $_FILES[$key]['error'] !== 0) {
            $errors[$key] = "Fichier obligatoire.";
            continue;
        }

        $file = $_FILES[$key];
        $allowed = ['image/jpeg','image/jpg','image/png','image/gif'];

        if (!in_array($file['type'], $allowed)) {
            $errors[$key] = "Format non autorisé.";
            continue;
        }

        if ($file['size'] > 2 * 1024 * 1024) {
            $errors[$key] = "Fichier max 2 Mo.";
            continue;
        }

        // unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $key . "_" . time() . "_" . bin2hex(random_bytes(6)) . "." . $ext;
        $path = "uploads/completerProfil/" . $filename;
        $fullPath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            $errors[$key] = "Upload impossible.";
        } else {
            $uploadedFiles[] = $fullPath;
        }
    }

    // if errors, remove uploaded files and return errors
    if (!empty($errors)) {
        foreach ($uploadedFiles as $file)
            if (file_exists($file)) unlink($file);

        echo json_encode(["success" => false, "errors" => $errors]);
        exit;
    }

    // insert into DB
    try {
        $stmt = $pdo->prepare("
            INSERT INTO profil_proprio 
            (id_utilisateur, adresse_personnelle, piece_recto, piece_verso, selfie_verification, description_proprio, photo_image)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $id_utilisateur,
            $adresse,
            $fileKeys["pieceRecto"],
            $fileKeys["pieceVerso"],
            $fileKeys["selfie"],
            $description,
            $fileKeys["photoLogo"]
        ]);

        // set user statut to 'en attente'
        $upd = $pdo->prepare("UPDATE utilisateur SET statut = 'en attente' WHERE id_utilisateur = ?");
        $upd->execute([$id_utilisateur]);

        echo json_encode([
            "success" => true,
            "message" => "Profil propriétaire complété avec succès !"
        ]);
        exit;

    } catch (Exception $e) {
        // remove uploaded files on DB error
        foreach ($uploadedFiles as $file)
            if (file_exists($file)) unlink($file);

        echo json_encode([
            "success" => false,
            "errors" => ["global" => "Erreur base de données."]
        ]);
        exit;
    }
}

// wrong method
echo json_encode(["success" => false, "errors" => ["method" => "Méthode non autorisée"]]);
exit;
?>
