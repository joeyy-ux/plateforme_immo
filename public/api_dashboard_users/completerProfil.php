<?php
session_start();

// En-têtes CORS
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization'); // <-- Ajout de Content-Type

// Gestion de la requête preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


require '../../src/config_db.php';

if (!isset($_SESSION['user']) || !isset($_SESSION['user']['id'])) {
    echo json_encode(['success' => false, 'message' => 'Utilisateur non connecté']);
    exit;
}
$id_utilisateur = $_SESSION['user']['id'];

// Récupérer le type de compte et statut
$stmt = $pdo->prepare("SELECT type_compte, statut FROM utilisateur WHERE id_utilisateur = ?");
$stmt->execute([$id_utilisateur]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        'success' => false,
        'message' => 'Utilisateur introuvable.'
    ]);
    exit();
}


// Déterminer la route de redirection
$redirect = '';
switch ($user['type_compte']) {
    case 'demarcheur':
        $redirect = '/profil_demarcheur';
        break;
    case 'agence':
        $redirect = '/profil_agence';
        break;
    case 'proprietaire':
        $redirect = '/profil_proprio';
        break;
    default:
        echo json_encode([
            'success' => false,
            'message' => 'Type de compte inconnu.'
        ]);
        exit();
}

// Réponse JSON pour React
echo json_encode([
    'success' => true,
    'message' => 'Utilisateur trouvé. Redirection en cours...',
    'redirect' => $redirect
]);
exit();
?>
