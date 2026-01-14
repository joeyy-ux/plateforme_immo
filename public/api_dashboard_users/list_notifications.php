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

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$per_page = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 20;
$offset = ($page - 1) * $per_page;

try {
    // total
    $tstmt = $pdo->prepare('SELECT COUNT(*) FROM notification WHERE id_utilisateur = :id_utilisateur');
    $tstmt->bindValue(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
    $tstmt->execute();
    $total = (int) $tstmt->fetchColumn();

    // use named parameter for id to avoid mixing positional and named params
    $stmt = $pdo->prepare(
        'SELECT id AS id_notification, COALESCE(titre, "") AS titre, COALESCE(message, "") AS contenu, url, is_read, created_at AS date_notification
         FROM notification
         WHERE id_utilisateur = :id_utilisateur
         ORDER BY created_at DESC
         LIMIT :offset, :limit'
    );
    $stmt->bindValue(':id_utilisateur', $id_utilisateur, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'notifications' => $notifications, 'total' => $total, 'page' => $page, 'per_page' => $per_page]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('list_notifications.php PDO ERROR: ' . $e->getMessage());
    // expose error message for debugging in local dev
    echo json_encode(['success' => false, 'message' => 'Erreur serveur', 'error' => $e->getMessage()]);
    exit;
}
