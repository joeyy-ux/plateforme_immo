<?php
header('Content-Type: application/json');
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
    $stmt = $pdo->prepare("UPDATE utilisateur SET statut = 'verifier' WHERE id_utilisateur = ? LIMIT 1");
    $stmt->execute([$id]);

    if ($stmt->rowCount() > 0) {
        // create a notification for the user
        $titre = 'Compte vérifié';
        $message = 'Votre compte a été vérifié par l\'administration. Vous pouvez désormais accéder à toutes les fonctionnalités.';
        $url = NULL;
        $nstmt = $pdo->prepare('INSERT INTO notification (id_utilisateur, titre, message, url, is_read) VALUES (?, ?, ?, ?, 0)');
        $nstmt->execute([$id, $titre, $message, $url]);

        echo json_encode(['success' => true]);
    } else {
        // no row updated (id missing)
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable ou déjà vérifié']);
    }
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('validate_user.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
