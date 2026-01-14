<?php
session_start();

/* =========================
   HEADERS
========================= */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    exit;
}

require '../../src/config_db.php';

/* =========================
   VALIDATION ID
========================= */
$id_bien = isset($_GET['id']) ? (int) $_GET['id'] : 0;

if ($id_bien <= 0) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'ID de bien invalide'
    ]);
    exit;
}

/* =========================
   RÉCUPÉRATION BIEN
========================= */
$stmt = $pdo->prepare("
    SELECT 
        ig.id_bien,
        ig.id_utilisateur,
        ig.type_bien,
        ig.type_offre,
        ig.statut,
        ig.meuble,
        ig.disponibilite,
        ig.surface,
        ig.prix_bien,
        ig.frais_visite,
        ig.prix_visite,
        ig.titre,
        ig.description,
        ig.statut_bien,
        ig.date_publication,
        pp.chemin_photo AS photo_principale
    FROM information_generale ig
    LEFT JOIN photo_principale_bien pp 
        ON ig.id_bien = pp.id_bien
    WHERE ig.id_bien = ?
");
$stmt->execute([$id_bien]);
$bienDB = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$bienDB) {
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'message' => 'Bien introuvable'
    ]);
    exit;
}

$isTerrain = ($bienDB['type_bien'] === 'Terrain');

/* =========================
   CONSTRUCTION ÉTAPE 1 — INFORMATIONS GÉNÉRALES
========================= */
$bien = [
    'id_bien'          => $bienDB['id_bien'],
    'type_bien'        => $bienDB['type_bien'],
    'type_offre'       => $bienDB['type_offre'],
    'surface'          => $bienDB['surface'],
    'prix_bien'        => $bienDB['prix_bien'],
    'frais_visite'     => $bienDB['frais_visite'],
    'prix_visite'      => $bienDB['prix_visite'],
    'titre'            => $bienDB['titre'],
    'description'      => $bienDB['description'],
    'statut_bien'      => $bienDB['statut_bien'],
    'date_publication' => $bienDB['date_publication'],
    'photo_principale' => $bienDB['photo_principale'],
];

/* ❌ Champs exclus pour Terrain */
if (!$isTerrain) {
    $bien['statut'] = $bienDB['statut'];
    $bien['meuble'] = $bienDB['meuble'];
    $bien['disponibilite'] = $bienDB['disponibilite'];
}

/* =========================
   ÉTAPE 2 — LOCALISATION (TOUJOURS)
========================= */
$stmt = $pdo->prepare("
    SELECT ville, commune, quartier
    FROM localisation_bien
    WHERE id_bien = ?
");
$stmt->execute([$id_bien]);
$localisation = $stmt->fetch(PDO::FETCH_ASSOC);

/* =========================
   STRUCTURE RÉPONSE
========================= */
$response = [
    'success' => true,
    'bien' => $bien,
    'localisation' => $localisation,
];

/* =========================
   ÉTAPE 4 — DOCUMENTS (TOUJOURS)
========================= */
$stmt = $pdo->prepare("
    SELECT nom_document
    FROM document_bien
    WHERE id_bien = ?
");
$stmt->execute([$id_bien]);
$response['documents'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

/* =========================
   ÉTAPE 6 — COMMODITÉS (TOUJOURS)
========================= */
$stmt = $pdo->prepare("
    SELECT nom_commodite
    FROM commodite_bien
    WHERE id_bien = ?
");
$stmt->execute([$id_bien]);
$response['commodites'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

/* =========================
   ÉTAPE 7 — CONDITIONS & BONUS (TOUJOURS)
========================= */
$stmt = $pdo->prepare("
    SELECT condition_text
    FROM condition_paiement_bien
    WHERE id_bien = ?
");
$stmt->execute([$id_bien]);
$response['conditions_paiement'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

$stmt = $pdo->prepare("
    SELECT bonus_text
    FROM bonus_bien
    WHERE id_bien = ?
");
$stmt->execute([$id_bien]);
$response['bonus'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

/* =========================
   ÉTAPE 8 — MÉDIAS (TOUJOURS)
========================= */
$stmt = $pdo->prepare("
    SELECT plateforme, lien_video
    FROM video_bien
    WHERE id_bien = ?
    LIMIT 1
");
$stmt->execute([$id_bien]);
$response['video'] = $stmt->fetch(PDO::FETCH_ASSOC);

/* =========================
   ÉTAPES CONDITIONNELLES (NON TERRAIN)
========================= */
if (!$isTerrain) {

    /* ÉTAPE 3 — CARACTÉRISTIQUES */
    $stmt = $pdo->prepare("
        SELECT titre, description
        FROM caracteristique_interieure
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $response['interieur'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT valeur
        FROM caracteristique_exterieure
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $response['exterieur'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    /* ÉTAPE 5 — ACCESSIBILITÉ */
    $stmt = $pdo->prepare("
        SELECT nom_accessibilite
        FROM accessibilite_bien
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $response['accessibilites'] = $stmt->fetchAll(PDO::FETCH_COLUMN);

    /* PIÈCES & PHOTOS */
    $stmt = $pdo->prepare("
        SELECT id_piece, nom_piece
        FROM piece_bien
        WHERE id_bien = ?
    ");
    $stmt->execute([$id_bien]);
    $pieces = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmtPhotos = $pdo->prepare("
        SELECT chemin_photo
        FROM photo_piece
        WHERE id_piece = ?
    ");

    $piecesWithPhotos = [];

    foreach ($pieces as $p) {
        $stmtPhotos->execute([$p['id_piece']]);
        $photos = $stmtPhotos->fetchAll(PDO::FETCH_COLUMN);

        $piecesWithPhotos[] = [
            'id_piece' => $p['id_piece'],
            'nom_piece' => $p['nom_piece'],
            'photos' => $photos
        ];
    }

    $response['pieces_with_photos'] = $piecesWithPhotos;
}

/* =========================
   OWNER
========================= */
$currentUserId = $_SESSION['user']['id'] ?? null;
$response['is_owner'] =
    $currentUserId && $currentUserId == $bienDB['id_utilisateur'];

/* =========================
    PROPRIÉTAIRE — toutes les colonnes disponibles
========================= */
$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE id_utilisateur = ?");
$stmt->execute([$bienDB['id_utilisateur']]);
$owner = $stmt->fetch(PDO::FETCH_ASSOC);
$response['utilisateur'] = $owner ?: null;

/* =========================
   JSON FINAL
========================= */
echo json_encode($response, JSON_UNESCAPED_UNICODE);
