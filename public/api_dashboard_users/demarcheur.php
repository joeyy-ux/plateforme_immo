<?php
session_start();

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

if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Utilisateur non connecté']]);
    exit;
}

$id_utilisateur = $_SESSION['user']['id'];

$errors = [];
$formData = [
    'adresse' => trim($_POST['adresse'] ?? ''),
    'description' => trim($_POST['description'] ?? ''),
    'statut' => trim($_POST['statut'] ?? ''),
    'fonction' => trim($_POST['fonction'] ?? ''),
    'numero_fonction' => trim($_POST['numero_fonction'] ?? '')
];

$uploadDir = __DIR__ . "/../../uploads/completerProfil/";
if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

$filesToCheck = ['photoLogo', 'pieceRecto', 'pieceVerso', 'selfie'];
$uploadedFiles = [];

// -----------------
// VALIDATION TEXTE
// -----------------
if ($formData['adresse'] === "") $errors['adresse'] = "L'adresse est obligatoire.";
elseif (strlen($formData['adresse']) < 5) $errors['adresse'] = "Trop courte (min 5).";
elseif (strlen($formData['adresse']) > 100) $errors['adresse'] = "Trop longue (max 100).";

if ($formData['description'] === "") $errors['description'] = "Description obligatoire.";
elseif (strlen($formData['description']) < 20) $errors['description'] = "Trop courte (min 20).";
elseif (strlen($formData['description']) > 500) $errors['description'] = "Trop longue (max 500).";

$validStatuts = ['independant','rattache','proprietaire'];
if (!in_array($formData['statut'], $validStatuts)) $errors['statut'] = "Veuillez sélectionner un statut.";

if ($formData['statut'] === "rattache" || $formData['statut'] === "proprietaire") {
    if ($formData['fonction'] === "") $errors['fonction'] = "Ce champ est obligatoire.";
    if (!preg_match("/^\d{10}$/", preg_replace("/\D/", "", $formData['numero_fonction']))) 
        $errors['numero_fonction'] = "Numéro invalide, 10 chiffres requis.";
}

// -----------------
// VALIDATION FICHIERS
// -----------------
foreach ($filesToCheck as $key) {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] != 0) {
        $errors[$key] = "Fichier obligatoire.";
        continue;
    }

    $file = $_FILES[$key];
    $allowed = ['image/jpeg','image/jpg','image/png','image/gif'];
    if (!in_array($file['type'], $allowed)) $errors[$key] = "Format de fichier non autorisé.";
    elseif ($file['size'] > 2*1024*1024) $errors[$key] = "Le fichier ne peut pas dépasser 2 Mo.";
    else {
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = $key . "_" . time() . "." . $ext;
        $filePath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $filePath)) {
            $errors[$key] = "Erreur lors de l'upload du fichier.";
        } else {
            $uploadedFiles[$key] = "uploads/completerProfil/" . $filename;
        }
    }
}

// Si erreur, supprimer les fichiers déjà uploadés
if (!empty($errors)) {
    foreach ($uploadedFiles as $f) { if (file_exists($f)) unlink($f); }
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit();
}

// -----------------
// INSERTION EN BASE
// -----------------
try {
    $stmt = $pdo->prepare("INSERT INTO profil_demarcheur 
        (id_utilisateur, adresse_personnelle, piece_recto, piece_verso, selfie_verification, statut, nom_contact, contact_telephone, description_demarcheur, photo_image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $id_utilisateur,
        $formData['adresse'],
        $uploadedFiles['pieceRecto'],
        $uploadedFiles['pieceVerso'],
        $uploadedFiles['selfie'],
        $formData['statut'],
        $formData['fonction'],
        $formData['numero_fonction'],
        $formData['description'],
        $uploadedFiles['photoLogo']
    ]);

    $update = $pdo->prepare("UPDATE utilisateur SET statut = 'en attente' WHERE id_utilisateur = ?");
    $update->execute([$id_utilisateur]);

    echo json_encode(['success' => true, 'message' => "Profil complété avec succès !"]);
    exit();

} catch (Exception $e) {
    // Supprimer fichiers uploadés si insertion échoue
    foreach ($uploadedFiles as $f) { if (file_exists($f)) unlink($f); }
    echo json_encode(['success' => false, 'errors' => ['global' => "Erreur serveur, réessayez."]]);
    exit();
}
