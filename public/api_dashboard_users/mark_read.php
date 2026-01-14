<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

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
require '../../src/config_db.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

$ids = [];
if (isset($input['ids']) && is_array($input['ids'])) {
    $ids = array_map('intval', $input['ids']);
} elseif (isset($input['id'])) {
    $ids = [intval($input['id'])];
}

if (count($ids) === 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No ids provided']);
    exit;
}

try {
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $params = $ids;
    // add user id param to restrict to owner
    $sql = "UPDATE notification SET is_read = 1 WHERE id IN ($placeholders) AND id_utilisateur = ?";
    $params[] = $id_utilisateur;
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'updated' => $stmt->rowCount()]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('mark_read.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
