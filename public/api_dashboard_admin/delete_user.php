<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

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
    // Optionally: remove related profiles first (profil_agence, profil_demarcheur, profil_proprio)
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('DELETE FROM utilisateur WHERE id_utilisateur = ?');
    $stmt->execute([$id]);

    $pdo->commit();

    echo json_encode(['success' => true]);
    exit;
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(500);
    error_log('delete_user.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
