<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing id']);
    exit;
}

$id = intval($input['id']);

require '../../src/config_db.php';

try {
    $stmt = $pdo->prepare("UPDATE utilisateur SET statut = 'suspendre' WHERE id_utilisateur = ? LIMIT 1");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        // insert notification for the user
        $titre = 'Compte suspendu';
        $message = 'Votre compte a été suspendu par l\'administration. Contactez le support pour plus d\'informations.';
        $nstmt = $pdo->prepare('INSERT INTO notification (id_utilisateur, titre, message, url, is_read) VALUES (?, ?, ?, NULL, 0)');
        $nstmt->execute([$id, $titre, $message]);

        echo json_encode(['success' => true]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
    }
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('suspend_user.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
