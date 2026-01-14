<?php
session_start();

/* ==========================================================
   HEADERS API - HISTORIQUE BIENS
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
   RÉCUPÉRATION HISTORIQUE BIENS
========================================================== */
try {
    $stmt = $pdo->prepare("
        SELECT * FROM historique_bien
        WHERE id_utilisateur = ?
        ORDER BY date_suppression DESC
    ");

    $stmt->execute([$id_utilisateur]);
    $historique = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Formater les données pour le frontend
    $historique_formate = array_map(function($bien) {
        return [
            'id_historique' => $bien['id_historique'],
            'id_bien' => $bien['id_bien'],
            'type_bien' => $bien['type_bien'],
            'type_offre' => $bien['type_offre'],
            'statut' => $bien['statut'],
            'meuble' => $bien['meuble'],
            'disponibilite' => $bien['disponibilite'],
            'surface' => $bien['surface'],
            'prix_bien' => $bien['prix_bien'],
            'frais_visite' => $bien['frais_visite'],
            'prix_visite' => $bien['prix_visite'],
            'titre' => $bien['titre'],
            'description' => $bien['description'],
            'statut_bien' => $bien['statut_bien'],
            'date_publication' => $bien['date_publication'],
            'photo_principale' => $bien['photo_principale'],
            'motif' => $bien['motif'],
            'date_suppression' => $bien['date_suppression']
        ];
    }, $historique);

    echo json_encode([
        'success' => true,
        'historique' => $historique_formate
    ]);

} catch (PDOException $e) {
    error_log("Erreur récupération historique: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'erreur' => 'Erreur lors de la récupération de l\'historique'
    ]);
    exit;
}
?>