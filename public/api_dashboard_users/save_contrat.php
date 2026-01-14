<?php
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

require '../../src/config_db.php';

// Auth
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Utilisateur non authentifié']);
    exit;
}

$id_utilisateur = (int) ($_SESSION['user']['id'] ?? 0);

// Read payload
if (!isset($_POST['data'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données manquantes']);
    exit;
}

$data = json_decode($_POST['data'], true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Format des données invalide']);
    exit;
}

$response = ['success' => false, 'message' => '', 'errors' => []];

// Helpers et regex (mêmes que le front)
$NUMERO_REGEX = '/^\+225(?: ?\d{2}){0,5}$/';
$MONTANT_REGEX = '/^[0-9\s\.,a-zA-Z]+$/u';
$FORBIDDEN_CHARS = '/[^a-zA-Z0-9\s.,\-\'"(){}àâéèêùûîïôœç]/u';

function isEmpty($v) { return !isset($v) || trim($v) === ''; }

// Champ attendu : id (id du bien)
$id_bien = isset($data['id']) ? (int)$data['id'] : (isset($data['id_bien']) ? (int)$data['id_bien'] : 0);
if ($id_bien <= 0) {
    $response['errors']['global'] = 'ID du bien manquant ou invalide';
    echo json_encode($response);
    exit;
}

// Récupérer bien depuis la BDD (même requête que contrat.php)
try {
    $sql = "SELECT ig.type_bien, ig.titre, ig.type_offre, ig.prix_bien, lb.ville, lb.commune, lb.quartier
            FROM information_generale ig
            LEFT JOIN localisation_bien lb ON ig.id_bien = lb.id_bien
            WHERE ig.id_bien = ? AND ig.id_utilisateur = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id_bien, $id_utilisateur]);
    $bien = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$bien) {
        $response['errors']['global'] = 'Bien non trouvé ou accès non autorisé';
        echo json_encode($response);
        exit;
    }
} catch (Throwable $e) {
    $response['errors']['sql'] = $e->getMessage();
    echo json_encode($response);
    exit;
}

// VALIDATIONS (même règles que le frontend)
$fieldsMap = [
    'prixBien' => 'prixBien',
    'typePaiement' => 'typePaiement',
    'montantVerse' => 'montantVerse',
    'datePaiement' => 'datePaiement',
    'nomProprietaire' => 'nomProprietaire',
    'telProprietaire' => 'telProprietaire',
    'typePieceProprietaire' => 'typePieceProprietaire',
    'numeroPieceProprietaire' => 'numeroPieceProprietaire',
    'nomClient' => 'nomClient',
    'telClient' => 'telClient',
    'typePieceClient' => 'typePieceClient',
    'numeroPieceClient' => 'numeroPieceClient',
    'nomProprietaireApprobation' => 'nomProprietaireApprobation',
    'nomClientApprobation' => 'nomClientApprobation',
    'nomClientApprobation2' => 'nomClientApprobation2'
];

$allowedTypePaiement = ["Virement", "Espèces", "Chèque", "Carte"]; 
$allowedTypePiece = ["CNI", "Passeport", "Carte de séjour", "Permis de conduire"]; 

foreach ($fieldsMap as $k => $v) {
    $val = isset($data[$k]) ? trim($data[$k]) : '';
    switch ($k) {
        case 'prixBien':
            if (isEmpty($val)) $response['errors'][$k] = 'Prix du bien requis';
            elseif (!preg_match($MONTANT_REGEX, $val) || strlen($val) < 1 || strlen($val) > 200) $response['errors'][$k] = 'Prix invalide';
            break;
        case 'typePaiement':
            if (isEmpty($val)) $response['errors'][$k] = 'Type de paiement requis';
            elseif (!in_array($val, $allowedTypePaiement, true)) $response['errors'][$k] = 'Type de paiement non autorisé';
            break;
        case 'montantVerse':
            if (isEmpty($val)) $response['errors'][$k] = 'Montant versé requis';
            elseif (!preg_match($MONTANT_REGEX, $val) || strlen($val) < 1 || strlen($val) > 200) $response['errors'][$k] = 'Montant invalide';
            break;
        case 'datePaiement':
            if (isEmpty($val)) $response['errors'][$k] = 'Date de paiement requise';
            // further date format checks possible
            break;
        case 'nomProprietaire':
        case 'nomClient':
        case 'nomProprietaireApprobation':
        case 'nomClientApprobation':
        case 'nomClientApprobation2':
            if (isEmpty($val)) $response['errors'][$k] = 'Nom requis';
            elseif (strlen($val) < 2 || strlen($val) > 200) $response['errors'][$k] = 'Min 2, max 200 caractères';
            elseif (preg_match($FORBIDDEN_CHARS, $val)) $response['errors'][$k] = 'Caractères non autorisés';
            break;
        case 'telProprietaire':
        case 'telClient':
            if (isEmpty($val)) $response['errors'][$k] = 'Téléphone requis';
            elseif (!preg_match($NUMERO_REGEX, $val)) $response['errors'][$k] = 'Format : +225 XX XX XX XX XX';
            break;
        case 'typePieceProprietaire':
        case 'typePieceClient':
            if (isEmpty($val)) $response['errors'][$k] = 'Type de pièce requis';
            elseif (!in_array($val, $allowedTypePiece, true)) $response['errors'][$k] = 'Type de pièce non autorisé';
            break;
        case 'numeroPieceProprietaire':
        case 'numeroPieceClient':
            if (isEmpty($val)) $response['errors'][$k] = 'Numéro de pièce requis';
            elseif (strlen($val) < 2 || strlen($val) > 200) $response['errors'][$k] = 'Min 2, max 200 caractères';
            elseif (preg_match($FORBIDDEN_CHARS, $val)) $response['errors'][$k] = 'Caractères non autorisés';
            break;
    }
}

// Si erreurs côté serveur, renvoyer pour affichage sous champs
if (!empty($response['errors'])) {
    echo json_encode($response);
    exit;
}

// Préparer insertion en DB: utiliser certaines valeurs du bien + données du formulaire
try {
    $pdo->beginTransaction();

    $insertSql = "INSERT INTO contrats_immobiliers (
        id_utilisateur, type_bien, type_offre, titre_bien, ville, commune, quartier,
        prix_bien, moyen_paiement, montant_verse, date_paiement,
        nom_proprietaire, tel_proprietaire, type_piece_proprietaire, numero_piece_proprietaire,
        nom_client, tel_client, type_piece_client, numero_piece_client,
        nom_proprietaire_approbation, nom_client_approbation, nom_client_approbation2
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )";

    $stmt = $pdo->prepare($insertSql);

    $stmt->execute([
        $id_utilisateur,
        $bien['type_bien'] ?? '',
        $bien['type_offre'] ?? '',
        $bien['titre'] ?? '',
        $bien['ville'] ?? '',
        $bien['commune'] ?? null,
        $bien['quartier'] ?? '',
        $data['prixBien'],
        $data['typePaiement'],
        $data['montantVerse'],
        $data['datePaiement'],
        $data['nomProprietaire'],
        $data['telProprietaire'],
        $data['typePieceProprietaire'],
        $data['numeroPieceProprietaire'],
        $data['nomClient'],
        $data['telClient'],
        $data['typePieceClient'],
        $data['numeroPieceClient'],
        $data['nomProprietaireApprobation'] ?? null,
        $data['nomClientApprobation'] ?? null,
        $data['nomClientApprobation2'] ?? null
    ]);

    $contratId = (int)$pdo->lastInsertId();

    // Insérer dans biens_conclus avec bien_conclu = 1
    $insert2 = $pdo->prepare("INSERT INTO biens_conclus (id_contrat, bien_conclu) VALUES (?, ?)");
    $insert2->execute([$contratId, 1]);

    $pdo->commit();

    $response['success'] = true;
    $response['message'] = 'Contrat enregistré';
    $response['contrat_id'] = $contratId;
    echo json_encode($response);
    exit;
} catch (Throwable $e) {
    $pdo->rollBack();
    $response['errors']['sql'] = $e->getMessage();
    echo json_encode($response);
    exit;
}
