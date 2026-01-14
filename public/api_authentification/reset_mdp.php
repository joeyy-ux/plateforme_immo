<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$password = $data['mot_de_passe'] ?? '';

if (empty($token) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Données manquantes']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT id_utilisateur FROM utilisateur WHERE verification_token = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Lien invalide ou déjà utilisé']);
        exit;
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $update = $pdo->prepare("UPDATE utilisateur SET mot_de_passe = ?, verification_token = NULL WHERE id_utilisateur = ?");
    $update->execute([$hash, $user['id_utilisateur']]);

    echo json_encode(['success' => true, 'message' => 'Mot de passe réinitialisé avec succès !']);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
}