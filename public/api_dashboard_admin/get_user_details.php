<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing id']);
    exit;
}

$id = intval($_GET['id']);
require '../../src/config_db.php';

try {
    $stmt = $pdo->prepare('SELECT * FROM utilisateur WHERE id_utilisateur = ? LIMIT 1');
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
        exit;
    }

    $profile = null;
    switch ($user['type_compte']) {
        case 'agence':
            $pstmt = $pdo->prepare('SELECT * FROM profil_agence WHERE id_utilisateur = ? LIMIT 1');
            $pstmt->execute([$id]);
            $profile = $pstmt->fetch(PDO::FETCH_ASSOC);
            break;
        case 'demarcheur':
            $pstmt = $pdo->prepare('SELECT * FROM profil_demarcheur WHERE id_utilisateur = ? LIMIT 1');
            $pstmt->execute([$id]);
            $profile = $pstmt->fetch(PDO::FETCH_ASSOC);
            break;
        case 'proprietaire':
        case 'proprio':
            $pstmt = $pdo->prepare('SELECT * FROM profil_proprio WHERE id_utilisateur = ? LIMIT 1');
            $pstmt->execute([$id]);
            $profile = $pstmt->fetch(PDO::FETCH_ASSOC);
            break;
        default:
            $profile = null;
    }

    echo json_encode(['success' => true, 'utilisateur' => $user, 'profile' => $profile]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_user_details.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
