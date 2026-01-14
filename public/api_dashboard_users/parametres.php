<?php
session_start();

/* ==========================================================
   HEADERS API
========================================================== */
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

/* ==========================================================
   SESSION UTILISATEUR
========================================================== */
if (!isset($_SESSION['user']['id'])) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur non connecté']
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];
$BASE_URL = 'http://localhost/plateforme_immobiliere/';

/* ==========================================================
   RÉCUPÉRATION UTILISATEUR
========================================================== */
$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE id_utilisateur = ? LIMIT 1");
$stmt->execute([$id_utilisateur]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode([
        'success' => false,
        'errors' => ['global' => 'Utilisateur introuvable']
    ]);
    exit;
}

/* ==========================================================
   STRUCTURE PAR DÉFAUT (IMPORTANT POUR REACT)
========================================================== */
$profil = [
    'nom_prenom' => $user['nom_prenom'] ?? '',
    'nom_agence' => $user['nom_agence'] ?? '',
    'numero' => $user['numero'] ?? '',
    'adresse' => '',
    'description' => '',
    'photo_url' => '',
    'fonction' => '',
    'numero_fonction' => '',
    'statut' => ''
];

/* ==========================================================
   CHARGEMENT SELON TYPE DE COMPTE
========================================================== */
if ($user['type_compte'] === 'agence') {
    $q = $pdo->prepare("SELECT * FROM profil_agence WHERE id_utilisateur = ? LIMIT 1");
    $q->execute([$id_utilisateur]);
    if ($p = $q->fetch()) {
        $profil['adresse'] = $p['adresse_siege'] ?? '';
        $profil['description'] = $p['description_agence'] ?? '';
        $profil['photo_url'] = $p['logo_agence']
            ? $BASE_URL . 'uploads/' . $p['logo_agence']
            : '';
    }
}

if ($user['type_compte'] === 'demarcheur') {
    $q = $pdo->prepare("SELECT * FROM profil_demarcheur WHERE id_utilisateur = ? LIMIT 1");
    $q->execute([$id_utilisateur]);
    if ($p = $q->fetch()) {
        $profil['adresse'] = $p['adresse_personnelle'] ?? '';
        $profil['description'] = $p['description_demarcheur'] ?? '';
        $profil['photo_url'] = $p['photo_image']
            ? $BASE_URL . 'uploads/' . $p['photo_image']
            : '';
        $profil['fonction'] = $p['nom_contact'] ?? '';
        $profil['numero_fonction'] = $p['contact_telephone'] ?? '';
        $profil['statut'] = $p['statut'] ?? '';
    }
}

if ($user['type_compte'] === 'proprietaire') {
    $q = $pdo->prepare("SELECT * FROM profil_proprio WHERE id_utilisateur = ? LIMIT 1");
    $q->execute([$id_utilisateur]);
    if ($p = $q->fetch()) {
        $profil['adresse'] = $p['adresse_personnelle'] ?? '';
        $profil['description'] = $p['description_proprio'] ?? '';
        $profil['photo_url'] = $p['photo_image']
            ? $BASE_URL . 'uploads/' . $p['photo_image']
            : '';
    }
}

/* ==========================================================
   RÉPONSE POUR LE FRONTEND
========================================================== */
echo json_encode([
    'success' => true,
    'email' => $user['email'],
    'type_compte' => $user['type_compte'],
    'created_at' => $user['created_at'],
    'nif' => $user['nif'] ?? null,
    'rccm' => $user['rccm'] ?? null,
    'profil' => $profil
]);
exit;
