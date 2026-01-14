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

/* ==========================================================
   INPUTS (ALIGNÉS FRONTEND)
========================================================== */
$ancien       = trim($_POST['ancien'] ?? '');
$nouveau      = trim($_POST['nouveau'] ?? '');
$confirmation = trim($_POST['confirmation'] ?? '');

$errors = [];

/* ==========================================================
   RÉCUPÉRATION MOT DE PASSE ACTUEL
========================================================== */
$stmt = $pdo->prepare(
    "SELECT mot_de_passe FROM utilisateur WHERE id_utilisateur = ? LIMIT 1"
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

/* ==========================================================
   VALIDATIONS (ERREURS PAR CHAMP)
========================================================== */

/* --- Ancien mot de passe --- */
if ($ancien === '') {
    $errors['ancien'] = 'Ancien mot de passe obligatoire';
} elseif (!password_verify($ancien, $user['mot_de_passe'])) {
    $errors['ancien'] = 'Ancien mot de passe incorrect';
}

/* --- Nouveau mot de passe --- */
if ($nouveau === '') {
    $errors['nouveau'] = 'Mot de passe obligatoire';
} else {
    // Same rules as registration: min 8, upper, lower, digit, special
    if (strlen($nouveau) < 8) {
        $errors['nouveau'] = 'Minimum 8 caractères';
    } elseif (!preg_match('/[A-Z]/', $nouveau)) {
        $errors['nouveau'] = 'Au moins une majuscule';
    } elseif (!preg_match('/[a-z]/', $nouveau)) {
        $errors['nouveau'] = 'Au moins une minuscule';
    } elseif (!preg_match('/\d/', $nouveau)) {
        $errors['nouveau'] = 'Au moins un chiffre';
    } elseif (!preg_match('/[!@#$%^&*]/', $nouveau)) {
        $errors['nouveau'] = 'Au moins un caractère spécial (!@#$%^&*)';
    } elseif (strlen($nouveau) > 128) {
        $errors['nouveau'] = 'Mot de passe trop long';
    } elseif (password_verify($nouveau, $user['mot_de_passe'])) {
        $errors['nouveau'] = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }
}

/* --- Confirmation --- */
if ($confirmation === '') {
    $errors['confirmation'] = 'Confirmation obligatoire';
} elseif ($nouveau !== $confirmation) {
    $errors['confirmation'] = 'Les mots de passe ne correspondent pas';
}

/* ==========================================================
   SI ERREURS → FRONTEND (BORDURE ROUGE)
========================================================== */
if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'errors' => $errors
    ]);
    exit;
}

/* ==========================================================
   UPDATE MOT DE PASSE
========================================================== */
try {
    $hash = password_hash($nouveau, PASSWORD_DEFAULT);

    $update = $pdo->prepare(
        "UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?"
    );
    $update->execute([$hash, $id_utilisateur]);

    if ($update->rowCount() === 0) {
        // No rows updated — treat as error
        echo json_encode([
            'success' => false,
            'errors' => ['global' => 'Impossible de mettre à jour le mot de passe']
        ]);
        exit;
    }

    // Success
    echo json_encode([
        'success' => true,
        'message' => 'Mot de passe modifié avec succès.'
    ]);
    exit;
} catch (Exception $e) {
    // Log error server-side if you have logging; return generic message to client
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Erreur serveur lors de la mise à jour']
    ]);
    exit;
}
