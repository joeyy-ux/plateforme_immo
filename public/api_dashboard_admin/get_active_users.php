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
    $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM utilisateur WHERE statut = 'verifier'");
    $countStmt->execute();
    $total = (int)$countStmt->fetchColumn();

    $stmt = $pdo->prepare(
        "SELECT u.id_utilisateur, u.type_compte, u.nom_prenom, u.nom_agence, u.email, u.created_at, u.statut,
                (SELECT COUNT(*) FROM information_generale ig WHERE ig.id_utilisateur = u.id_utilisateur) AS nb_biens,
                (SELECT COUNT(bc.id) FROM biens_conclus bc JOIN contrats_immobiliers c ON c.id_contrat = bc.id_contrat WHERE c.id_utilisateur = u.id_utilisateur AND bc.bien_conclu = 1) AS biens_conclus
         FROM utilisateur u
         WHERE u.statut = 'verifier'
         ORDER BY u.created_at DESC
         LIMIT :offset, :limit"
    );
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
    error_log('get_active_users.php PDO ERROR: ' . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
