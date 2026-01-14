<?php
session_start();

/* =========================
   HEADERS CORS
========================= */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

/* =========================
   PREFLIGHT
========================= */
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

/* =========================
   AUTHENTIFICATION
========================= */
if (!isset($_SESSION['user'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Utilisateur non connecté'
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

/* =========================
   UTILISATEUR
========================= */
$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE id_utilisateur = ?");
$stmt->execute([$id_utilisateur]);
$utilisateur = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$utilisateur) {
    echo json_encode([
        'success' => false,
        'message' => 'Utilisateur introuvable'
    ]);
    exit;
}

/* =========================
   PHOTO PROFIL (LOGIQUE UNIFIÉE)
========================= */
$photoProfil = '';
$BASE_URL = 'http://localhost/plateforme_immobiliere/';
$profilStmt = null;

switch ($utilisateur['type_compte']) {
    case 'demarcheur':
        $profilStmt = $pdo->prepare("SELECT photo_image FROM profil_demarcheur WHERE id_utilisateur = ?");
        break;
    case 'agence':
        $profilStmt = $pdo->prepare("SELECT logo_agence AS photo_image FROM profil_agence WHERE id_utilisateur = ?");
        break;
    case 'proprietaire':
        $profilStmt = $pdo->prepare("SELECT photo_image FROM profil_proprio WHERE id_utilisateur = ?");
        break;
}

if ($profilStmt) {
    $profilStmt->execute([$id_utilisateur]);
    $profil = $profilStmt->fetch(PDO::FETCH_ASSOC);
    $photoProfil = $profil['photo_image'] ?? '';
}

if (!empty($photoProfil) && !preg_match('#^https?://#i', $photoProfil)) {
    $photoProfil = rtrim($BASE_URL, '/') . '/' . ltrim($photoProfil, '/');
}


/* =========================
   STATUT + PROGRESSION
========================= */
$statut = $utilisateur['statut'] ?? 'incomplet';

switch ($statut) {
    case 'verifier':
        $progress = 100;
        break;
    case 'en attente':
        $progress = 60;
        break;
    default:
        $statut = 'incomplet';
        $progress = 24;
}

$utilisateur['statut'] = $statut;
$utilisateur['progress'] = $progress;

/* =========================
   STATISTIQUES
========================= */
$stmt = $pdo->prepare(
    "SELECT COUNT(*) FROM information_generale WHERE id_utilisateur = ? AND (
        LOWER(COALESCE(statut_bien, '')) IN ('publie','publié') OR
        LOWER(COALESCE(statut, '')) IN ('publie','publié') OR
        LOWER(COALESCE(statut_bien, '')) LIKE 'publi%'
    )"
);
$stmt->execute([$id_utilisateur]);
$nbAnnonces = (int) $stmt->fetchColumn();

// Compter les biens conclus à partir de la table `biens_conclus` liée aux contrats
$stmt = $pdo->prepare(
    "SELECT COUNT(bc.id) FROM biens_conclus bc
     JOIN contrats_immobiliers c ON c.id_contrat = bc.id_contrat
     WHERE c.id_utilisateur = ? AND bc.bien_conclu = 1"
);
$stmt->execute([$id_utilisateur]);
$nbBiensConclus = (int) $stmt->fetchColumn();

/* =========================
   NOTIFICATIONS
========================= */
// unread count
$countStmt = $pdo->prepare("SELECT COUNT(*) FROM notification WHERE id_utilisateur = ? AND is_read = 0");
$countStmt->execute([$id_utilisateur]);
$unreadCount = (int) $countStmt->fetchColumn();

// select latest 5 notifications (provide fields compatible with existing frontend)
$stmt = $pdo->prepare(
    "SELECT id AS id_notification, COALESCE(titre, '') AS titre, COALESCE(message, '') AS contenu, url, is_read, created_at AS date_notification \n     FROM notification \n     WHERE id_utilisateur = ? \n     ORDER BY created_at DESC LIMIT 5"
);
$stmt->execute([$id_utilisateur]);
$notifications = $stmt->fetchAll(PDO::FETCH_ASSOC);


/* =========================
   DERNIÈRES ANNONCES (SANS DESCRIPTION)
========================= */
$stmt = $pdo->prepare("
    SELECT 
        ig.id_bien,
        ig.titre,
        ig.prix_bien AS prix,
        ig.type_bien,
        ig.statut_bien,
        lb.ville,
        ppb.chemin_photo AS photo_principale,
        ig.date_publication
    FROM information_generale ig
    LEFT JOIN localisation_bien lb ON lb.id_bien = ig.id_bien
    LEFT JOIN photo_principale_bien ppb ON ppb.id_bien = ig.id_bien
    WHERE ig.id_utilisateur = ?
    ORDER BY ig.date_publication DESC
    LIMIT 5
");
$stmt->execute([$id_utilisateur]);
$biens = $stmt->fetchAll(PDO::FETCH_ASSOC);

/* =========================
   NORMALISATION PHOTO ANNONCE
   (IDENTIQUE À TES AUTRES BACKENDS)
========================= */
foreach ($biens as &$b) {
    if (!empty($b['photo_principale'])) {

        $photo = trim($b['photo_principale']);

        // URL absolue → on garde
        if (preg_match('#^https?://#i', $photo)) {
            $b['photo_principale'] = $photo;
            continue;
        }

        // Nettoyage des slashes
        $clean = preg_replace('#^/+?#', '', $photo);

        // Ajout uploads/ si absent
        if (stripos($clean, 'uploads/') === false) {
            $clean = 'uploads/' . $clean;
        }

        $b['photo_principale'] = $clean;
    }
}
unset($b);

// garantir que messages existe
$messages = $messages ?? [];

/* =========================
   RÉPONSE FINALE
========================= */
echo json_encode([
    'success' => true,
    'utilisateur' => $utilisateur,
    'photoProfil' => $photoProfil,
    'nbAnnonces' => $nbAnnonces,
    'nbBiensConclus' => $nbBiensConclus,
    'notifications' => $notifications,
    'unreadNotifications' => $unreadCount,
    'messages' => $messages,
    'biens' => $biens
]);

