<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

try {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM notification WHERE id_utilisateur = ? AND is_read = 0');
    $stmt->execute([$id_utilisateur]);
    $count = (int) $stmt->fetchColumn();
    echo json_encode(['success' => true, 'count' => $count]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_unread_count.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
