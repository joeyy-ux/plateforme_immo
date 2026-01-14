<?php
session_start();

/* ==========================================================
   HEADERS API - DÉTAILS HISTORIQUE BIEN
========================================================== */
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

/* ==========================================================
   SESSION UTILISATEUR - VÉRIFICATION CONNEXION
========================================================== */
if (!isset($_SESSION['user']['id'])) {
    echo json_encode([
        'success' => false,
        'erreur' => 'Utilisateur non connecté'
    ]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

/* ==========================================================
   INPUT VALIDATION - RÉCUPÉRATION ID HISTORIQUE
========================================================== */
$id_historique = (int) ($_GET['id'] ?? 0);

if ($id_historique <= 0) {
    echo json_encode([
        'success' => false,
        'erreur' => 'ID historique invalide'
    ]);
    exit;
}

/* ==========================================================
   RÉCUPÉRATION DÉTAILS HISTORIQUE
========================================================== */
try {
    // Récupération des informations principales depuis historique_bien
    $stmt = $pdo->prepare("
        SELECT * FROM historique_bien
        WHERE id_historique = ? AND id_utilisateur = ?
    ");
    $stmt->execute([$id_historique, $id_utilisateur]);
    $historique = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$historique) {
        echo json_encode([
            'success' => false,
            'erreur' => 'Bien historique non trouvé'
        ]);
        exit;
    }

    // Structure de base des détails (seulement depuis historique_bien)
    $details = [
        'id_historique' => $historique['id_historique'],
        'id_bien' => $historique['id_bien'],
        'informations_generales' => [
            'type_bien' => $historique['type_bien'],
            'type_offre' => $historique['type_offre'],
            'statut' => $historique['statut'],
            'meuble' => $historique['meuble'],
            'disponibilite' => $historique['disponibilite'],
            'surface' => $historique['surface'],
            'prix_bien' => $historique['prix_bien'],
            'frais_visite' => $historique['frais_visite'],
            'prix_visite' => $historique['prix_visite'],
            'titre' => $historique['titre'],
            'description' => $historique['description'],
            'date_publication' => $historique['date_publication']
        ],
        'motif_suppression' => $historique['motif'],
        'date_suppression' => $historique['date_suppression'],
        'photo_principale' => $historique['photo_principale'],
        'localisation' => null, // Non disponible car supprimé
        'caracteristiques' => [
            'interieur' => [], // Non disponible car supprimé
            'exterieur' => []  // Non disponible car supprimé
        ],
        'documents' => [], // Non disponible car supprimé
        'accessibilite' => [], // Non disponible car supprimé
        'commodites' => [], // Non disponible car supprimé
        'conditions_bonus' => [
            'conditions_paiement' => [], // Non disponible car supprimé
            'bonus' => [] // Non disponible car supprimé
        ],
        'medias' => [
            'pieces' => [], // Non disponible car supprimé
            'video' => null // Non disponible car supprimé
        ]
    ];

    echo json_encode([
        'success' => true,
        'details' => $details
    ]);

} catch (PDOException $e) {
    error_log("Erreur récupération détails historique: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de la récupération des détails'
    ]);
    exit;
}
?>