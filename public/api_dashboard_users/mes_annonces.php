<?php
// mes_annonces.php
session_start();

/* =========================
   HEADERS CORS
========================= */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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
   REQUÊTE PRINCIPALE
========================= */
$sql = "
    SELECT 
        ig.id_bien,
        ig.type_bien,
        ig.titre,
        ig.type_offre,
        ig.statut_bien,
        ig.date_publication,
        ig.prix_bien,
        pp.chemin_photo,
        lb.ville
    FROM information_generale ig
    LEFT JOIN photo_principale_bien pp 
        ON ig.id_bien = pp.id_bien
    LEFT JOIN localisation_bien lb 
        ON ig.id_bien = lb.id_bien
    WHERE ig.id_utilisateur = ?
    ORDER BY ig.date_publication DESC
";

try {
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_utilisateur]);
    $biens = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'errors' => ['sql' => $e->getMessage()]
    ]);
    exit;
}

/* =========================
   UTILITAIRE "IL Y A X"
========================= */
function timeAgoFr($datetime) {
    if (!$datetime) return '';

    $now  = new DateTime('now', new DateTimeZone('UTC'));
    $past = new DateTime($datetime, new DateTimeZone('UTC'));
    $diff = $now->diff($past);

    if ($diff->y > 0) return "il y a {$diff->y} an" . ($diff->y > 1 ? "s" : "");
    if ($diff->m > 0) return "il y a {$diff->m} mois";
    if ($diff->d > 0) return "il y a {$diff->d} jour" . ($diff->d > 1 ? "s" : "");
    if ($diff->h > 0) return "il y a {$diff->h} heure" . ($diff->h > 1 ? "s" : "");
    if ($diff->i > 0) return "il y a {$diff->i} minute" . ($diff->i > 1 ? "s" : "");
    return "à l'instant";
}

/* =========================
   FORMATAGE FRONTEND
========================= */
$annonces = array_map(function ($bien) {

    $statutRaw = strtolower(trim($bien['statut_bien'] ?? 'en attente'));

    switch ($statutRaw) {
        case 'publie':
        case 'publié':
            $statut = 'publie';
            break;
        case 'suspendre':
        case 'suspendu':
            $statut = 'suspendre';
            break;
        case 'supprime':
        case 'supprimé':
            $statut = 'supprime';
            break;
        default:
            $statut = 'attente';
    }

    return [
        'id'    => (int) $bien['id_bien'],
        'titre' => $bien['titre'],
        'type'  => $bien['type_bien'],
        'offre' => $bien['type_offre'],
        'statut'=> $statut,
        'date'  => $bien['date_publication'],
        'since' => timeAgoFr($bien['date_publication']),
        'photo' => $bien['chemin_photo'] ?: null,
        'prix'  => $bien['prix_bien'] ?: null,
        'ville' => $bien['ville'] ?: null,
    ];
}, $biens);

/* =========================
   RÉPONSE FINALE
========================= */
echo json_encode([
    'success'  => true,
    'annonces' => $annonces
]);
