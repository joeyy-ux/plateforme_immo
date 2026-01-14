<?php
session_start();

/* CORS config */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (!isset($_SESSION['user'])) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Utilisateur non connecté']]);
    exit;
}

$id_utilisateur = $_SESSION['user']['id'];

require '../../src/config_db.php'; // Vérifie le chemin et que $pdo est bien défini

$id_utilisateur = intval($_SESSION['user']['id']);
$BASE_URL = 'http://localhost/plateforme_immobiliere/';

try {
    $stmt = $pdo->prepare("SELECT nom_prenom, nom_agence, type_compte, statut FROM utilisateur WHERE id_utilisateur = ? LIMIT 1");
    $stmt->execute([$id_utilisateur]);
    $utilisateur = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$utilisateur) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Utilisateur introuvable']);
        exit;
    }

    $photo_profil = '';
    $table_query = null;

    switch ($utilisateur['type_compte']) {
        case 'demarcheur':
            $table_query = "SELECT photo_image FROM profil_demarcheur WHERE id_utilisateur = ? LIMIT 1";
            break;
        case 'agence':
            $table_query = "SELECT logo_agence AS photo_image FROM profil_agence WHERE id_utilisateur = ? LIMIT 1";
            break;
        case 'proprietaire':
            $table_query = "SELECT photo_image FROM profil_proprio WHERE id_utilisateur = ? LIMIT 1";
            break;
        default:
            $photo_profil = '';
    }

    if ($table_query) {
        $stmt2 = $pdo->prepare($table_query);
        $stmt2->execute([$id_utilisateur]);
        $profil = $stmt2->fetch(PDO::FETCH_ASSOC);
        $photo_profil = $profil['photo_image'] ?? '';
    }

    if (!empty($photo_profil) && !preg_match('#^https?://#i', $photo_profil)) {
        $photo_profil = rtrim($BASE_URL, '/') . '/' . ltrim($photo_profil, '/');
    }

    echo json_encode([
        'success' => true,
        'user' => [
            'nom' => $utilisateur['nom_prenom'],
            'nom' => $utilisateur['nom_agence'],
            'type_compte' => $utilisateur['type_compte'],
            'statut' => $utilisateur['statut'],
            'photo' => $photo_profil
        ]
    ]);
    exit;

} catch (PDOException $e) {
    http_response_code(500);
    error_log("navbar.php PDO ERROR : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur (base de données)']);
    exit;
} catch (Throwable $t) {
    http_response_code(500);
    error_log("navbar.php ERROR : " . $t->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur']);
    exit;
}
