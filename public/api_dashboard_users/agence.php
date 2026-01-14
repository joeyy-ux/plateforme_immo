<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

require '../../src/config_db.php';

if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$id_utilisateur = $_SESSION['user']['id'];
$errors = [];
$uploadedFiles = [];

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $adresse = trim($_POST['adresse'] ?? '');
    $nif = trim($_POST['nif'] ?? '');
    $rccm = trim($_POST['rccm'] ?? '');
    $experience = trim($_POST['experience'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $logoPath = "";

    $uploadDir = __DIR__ . '/../../uploads/completerProfil/';
    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

    // --- Upload logo ---
    if(isset($_FILES['logo']) && $_FILES['logo']['error'] === 0){
        $file = $_FILES['logo'];
        $allowed = ['image/jpeg','image/jpg','image/png','image/gif'];

        if(!in_array($file['type'], $allowed)) $errors['logo'] = "Format image non autorisé";
        elseif($file['size'] > 2*1024*1024) $errors['logo'] = "Taille max 2 Mo";
        else {
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = "logo_".time().".".$ext;
            $logoPath = "uploads/completerProfil/" . $filename;
            $fullPath = $uploadDir . $filename;
            if(!move_uploaded_file($file['tmp_name'], $fullPath))
                $errors['logo'] = "Erreur upload logo";
            else
                $uploadedFiles[] = $fullPath;
        }
    } else {
        $errors['logo'] = "Logo obligatoire";
    }

    // --- Validation ---
    if(empty($adresse)) $errors['adresse'] = "Adresse obligatoire";
    if(!empty($nif) && !preg_match("/^CI-\d{10}[A-Z0-9]{2}$/",$nif)) $errors['nif']="Format NIF invalide";
    if(!empty($rccm) && !preg_match("/^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/",$rccm)) $errors['rccm']="Format RCCM invalide";
    if(!empty($experience) && (!filter_var($experience,FILTER_VALIDATE_INT) || $experience<0 || $experience>100)) $errors['experience']="Nombre entier entre 0 et 100 requis";
    if(empty($description) || strlen($description)<20) $errors['description']="Description invalide";

    if(empty($errors)){
        try {
            $stmt = $pdo->prepare("INSERT INTO profil_agence (id_utilisateur, adresse_siege, nif, rccm, annee_experience, description_agence, logo_agence) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id_utilisateur,$adresse,$nif,$rccm,$experience,$description,$logoPath]);
            
            $update = $pdo->prepare("UPDATE utilisateur SET statut = 'en attente' WHERE id_utilisateur = ?");
            $update->execute([$id_utilisateur]);

            echo json_encode(['success'=>true,'message'=>"Profil complété avec succès !"]);
        } catch (Exception $e) {
            // Supprimer les fichiers uploadés si insert échoue
            foreach($uploadedFiles as $file) if(file_exists($file)) unlink($file);
            echo json_encode(['success'=>false,'errors'=>['global'=>"Erreur base de données"]]);
        }
    } else {
        // Supprimer les fichiers uploadés si validation échoue
        foreach($uploadedFiles as $file) if(file_exists($file)) unlink($file);
        echo json_encode(['success'=>false,'errors'=>$errors]);
    }
}
