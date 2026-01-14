<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

$page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
$per_page = isset($_GET['per_page']) ? max(1, intval($_GET['per_page'])) : 8;
$offset = ($page - 1) * $per_page;

try {
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM utilisateur WHERE statut = 'en attente'");
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare("SELECT id_utilisateur, type_compte, nom_prenom, nom_agence, email, created_at, statut FROM utilisateur WHERE statut = 'en attente' ORDER BY created_at DESC LIMIT :offset, :limit");
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $per_page, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'total' => $total,
        'page' => $page,
        'per_page' => $per_page,
        'users' => $users
    ]);
    exit;
} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_pending_users.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
