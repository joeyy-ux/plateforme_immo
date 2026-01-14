<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');

if (!isset($_SESSION['pending_verification']['email'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Aucune session', 'erreurs' => []]);
    exit;
}

echo json_encode(['success' => true, 'email' => $_SESSION['pending_verification']['email'], 'erreurs' => []]);