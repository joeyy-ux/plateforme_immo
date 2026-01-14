<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

use PHPMailer\PHPMailer\PHPMailer;
require '../../vendor/autoload.php';
require '../../src/config_db.php';

if (!isset($_SESSION['pending_verification']['email'])) {
    echo json_encode(['success' => false, 'message' => 'Session expirée', 'erreurs' => []]);
    exit;
}

$email = $_SESSION['pending_verification']['email'];

// Récupérer l'utilisateur
$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ? AND email_verified = 0");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Compte déjà vérifié ou introuvable', 'erreurs' => []]);
    exit;
}

// Nouveau token
$token = bin2hex(random_bytes(32));
$pdo->prepare("UPDATE utilisateur SET verification_token = ? WHERE email = ?")
    ->execute([$token, $email]);

// Lien (toujours vers le frontend)
$link = "http://localhost:5173/confirmation?token=$token";

// Envoi email
$mail = new PHPMailer(true);
try {
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
    $mail->Subject = 'Nouveau lien de vérification';
    $mail->Body = "
        <h2>Nouveau lien de confirmation</h2>
        <p>Cliquez ici pour activer votre compte :</p>
        <a href='$link' style='background:#ff6600;color:#fff;padding:15px 30px;text-decoration:none;border-radius:50px;'>Activer mon compte</a>
        <p>Valable 1 heure.</p>
    ";
    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Nouveau lien envoyé avec succès !', 'erreurs' => []]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Erreur envoi email', 'erreurs' => []]);
}