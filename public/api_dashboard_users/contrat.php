<?php
// contrat.php - Récupération des informations d'un bien pour le contrat
session_start();

/* =========================
   HEADERS CORS
========================= */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/* =========================
   CONNEXION BDD
========================= */
require_once __DIR__ . '../../../src/config_db.php';

/* =========================
   AUTHENTIFICATION
========================= */
if (!isset($_SESSION['user'])) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur non connecté']
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

/* =========================
   VALIDATION PARAMÈTRE
========================= */
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'ID du bien manquant ou invalide']
    ]);
    exit;
}

$id_bien = (int) $_GET['id'];

/* =========================
   REQUÊTE POUR RÉCUPÉRER LES INFOS DU BIEN
========================= */
$sql = "
    SELECT
        ig.type_bien,
        ig.titre,
        ig.type_offre,
        ig.prix_bien,
        lb.ville,
        lb.commune,
        lb.quartier
    FROM information_generale ig
    LEFT JOIN localisation_bien lb
        ON ig.id_bien = lb.id_bien
    WHERE ig.id_bien = ? AND ig.id_utilisateur = ?
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_bien, $id_utilisateur]);
    $bien = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$bien) {
        echo json_encode([
            'success' => false,
            'errors' => ['global' => 'Bien non trouvé ou accès non autorisé']
        ]);
        exit;
    }
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'errors' => ['sql' => $e->getMessage()]
    ]);
    exit;
}

/* =========================
   RÉPONSE FINALE
========================= */
echo json_encode([
    'success' => true,
    'bien' => $bien
]);
?>