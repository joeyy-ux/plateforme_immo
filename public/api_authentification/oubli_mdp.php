<?php
// public/api/oubli_mdp.php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';
require '../../vendor/autoload.php'; // PHPMailer

use PHPMailer\PHPMailer\PHPMailer;

$data = json_decode(file_get_contents('php://input'), true);
$email = trim($data['email'] ?? '');

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email invalide.']);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // On ne dit pas "compte inexistant" pour sécurité
        echo json_encode([
            'success' => true,
            'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
        ]);
        exit;
    }

    if ($user['email_verified'] != 1) {
        echo json_encode(['success' => false, 'message' => 'Votre email n\'est pas encore vérifié.']);
        exit;
    }

    // Générer ou réutiliser le token
    $token = $user['verification_token'] ?: bin2hex(random_bytes(16));
    if (!$user['verification_token']) {
        $pdo->prepare("UPDATE utilisateur SET verification_token = ? WHERE id_utilisateur = ?")
            ->execute([$token, $user['id_utilisateur']]);
    }

    $reset_link = "http://localhost:5173/reset_mdp?token=$token";

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'konannguessancyriac0177@gmail.com';
    $mail->Password = 'xytb npbb tmcp fhlb';
    $mail->SMTPSecure = 'tls';
    $mail->Port = 587;
    $mail->setFrom('konannguessancyriac0177@gmail.com', 'Plateforme Immo');
    $mail->addAddress($email);
    $mail->isHTML(true);
    $mail->Subject = 'Réinitialisation de votre mot de passe';
    $mail->Body = "
        <div style='font-family: Arial, sans-serif; text-align: center; padding: 20px;'>
            <h2>Réinitialisation du mot de passe</h2>
            <p>Bonjour <strong>" . ($user['nom_prenom'] ?: $user['nom_agence']) . "</strong>,</p>
            <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
            <p>Cliquez sur le bouton ci-dessous (valable 1 heure) :</p>
            <a href='$reset_link' style='background:#ff6600;color:white;padding:12px 30px;text-decoration:none;border-radius:8px;display:inline-block;margin:20px;'>
                Réinitialiser mon mot de passe
            </a>
            <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        </div>
    ";

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Un lien de réinitialisation a été envoyé à votre adresse email.'
    ]);

} catch (Exception $e) {
    error_log("Erreur envoi email oubli_mdp : " . $e->getMessage());
    echo json_encode([
        'success' => true,
        'message' => 'Si cet email existe, un lien de réinitialisation a été envoyé.'
    ]);
}
?>