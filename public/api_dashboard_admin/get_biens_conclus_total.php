<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

try {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM biens_conclus WHERE bien_conclu = 1");
    $stmt->execute();
    $total = (int) $stmt->fetchColumn();

    echo json_encode(['success' => true, 'total_biens_conclus' => $total]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_biens_conclus_total.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
