<?php
// public/api/verif_lien.php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    echo json_encode(['success' => false, 'message' => 'Lien invalide ou token manquant.']);
    exit;
}

try {
    // On cherche par token
    $stmt = $pdo->prepare("SELECT id_utilisateur, email_verified FROM utilisateur WHERE verification_token = ?");
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Cas 1 : Token valide → on vérifie
    if ($user) {
        if ($user['email_verified'] == 1) {
            // Déjà vérifié → SUCCÈS quand même !
            echo json_encode([
                'success' => true,
                'message' => 'Votre compte est déjà vérifié. Vous pouvez vous connecter.'
            ]);
        } else {
            // On valide maintenant
            $pdo->prepare("UPDATE utilisateur SET email_verified = 1, verification_token = NULL WHERE id_utilisateur = ?")
                ->execute([$user['id_utilisateur']]);
            echo json_encode([
                'success' => true,
                'message' => 'Félicitations ! Votre email a été vérifié avec succès.'
            ]);
        }
        unset($_SESSION['pending_verification']);
        exit;
    }

    // Cas 2 : Token inconnu → on regarde si l'email existe et est déjà vérifié
    // (cas où le token a été effacé mais l'utilisateur existe)
    $email_stmt = $pdo->prepare("SELECT email_verified FROM utilisateur WHERE verification_token IS NULL AND email_verified = 1 LIMIT 1");
    $email_stmt->execute();
    if ($email_stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'message' => 'Ce lien a déjà été utilisé. Votre compte est déjà vérifié.'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Ce lien est invalide ou a expiré.'
        ]);
    }

} catch (Exception $e) {
    error_log("Erreur verif_lien.php : " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Erreur serveur.']);
}
?>