<?php
// ========== TOUT ÇA DOIT ÊTRE EN TOUT PREMIER ! ==========

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Origin: http://localhost:5173');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Maintenant le reste de code
use PHPMailer\PHPMailer\PHPMailer;
require '../../vendor/autoload.php';
require '../../src/config_db.php';

// Si ce n’est pas POST → erreur (après le OPTIONS)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée', 'erreurs' => []]);
    exit;
}

// ... tout le reste de ton code (data, validations, etc.) reste IDENTIQUE
$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Données invalides', 'erreurs' => []]);
    exit;
}

// =============================================
// RÉCUPÉRATION DES DONNÉES
// =============================================
$type_compte      = trim($data['type_compte'] ?? '');
$nom_prenom       = trim($data['nom_prenom'] ?? '');
$nom_agence       = trim($data['nom_agence'] ?? '');
$numero           = trim($data['numero'] ?? '');
$email            = trim($data['email'] ?? '');
$mot_de_passe     = $data['mot_de_passe'] ?? '';
$confirm_password = $data['confirm_password'] ?? '';

$erreurs = [];

// =============================================
// VALIDATIONS IDENTIQUES AU FRONT
// =============================================
if (empty($type_compte)) {
    $erreurs['type_compte'] = 'Veuillez sélectionner un type de compte.';
}

if ($type_compte === 'agence' && empty($nom_agence)) {
    $erreurs['nom_agence'] = 'Ce champ est obligatoire.';
}
if (in_array($type_compte, ['proprietaire', 'demarcheur']) && empty($nom_prenom)) {
    $erreurs['nom_prenom'] = 'Ce champ est obligatoire.';
}

// NUMÉRO : on accepte le format frontend "+225 XX XX XX XX XX" ou une chaîne de chiffres
if (empty($numero)) {
    $erreurs['numero'] = 'Le numéro est obligatoire.';
} else {
    // On conserve uniquement les chiffres pour valider
    $numero_clean = preg_replace('/\D/', '', $numero);
    // Doit commencer par 225 suivi de 10 chiffres
    if (!preg_match('/^225\d{10}$/', $numero_clean)) {
        $erreurs['numero'] = 'Format : +225 XX XX XX XX XX';
    } else {
        // Reformattage en +225 XX XX XX XX XX
        $rest = substr($numero_clean, 3); // les 10 chiffres après le préfixe 225
        $groups = str_split($rest, 2);
        $numero = '+225 ' . implode(' ', $groups);
    }
}

if (empty($email)) {
    $erreurs['email'] = 'L\'email est obligatoire.';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $erreurs['email'] = 'Email invalide.';
}

if (empty($mot_de_passe)) {
    $erreurs['mot_de_passe'] = 'Le mot de passe est obligatoire.';
} elseif (strlen($mot_de_passe) < 8) {
    $erreurs['mot_de_passe'] = 'Minimum 8 caractères.';
} elseif (!preg_match("/[A-Z]/", $mot_de_passe)) {
    $erreurs['mot_de_passe'] = 'Au moins une majuscule.';
} elseif (!preg_match("/[a-z]/", $mot_de_passe)) {
    $erreurs['mot_de_passe'] = 'Au moins une minuscule.';
} elseif (!preg_match("/\d/", $mot_de_passe)) {
    $erreurs['mot_de_passe'] = 'Au moins un chiffre.';
} elseif (!preg_match("/[!@#$%^&*]/", $mot_de_passe)) {
    $erreurs['mot_de_passe'] = 'Au moins un caractère spécial (!@#$%^&*).';
}

if ($mot_de_passe !== $confirm_password) {
    $erreurs['confirm_password'] = 'Les mots de passe ne correspondent pas.';
}

// =============================================
// VÉRIFICATION DOUBLONS
// =============================================
if (empty($erreurs) && isset($numero)) {
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM utilisateur WHERE email = ? OR numero = ?");
    $stmt->execute([$email, $numero]);
    if ($stmt->fetchColumn() > 0) {
        $stmt = $pdo->prepare("SELECT email FROM utilisateur WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $erreurs['email'] = 'Cet email existe déjà.';
        } else {
            $erreurs['numero'] = 'Ce numéro existe déjà.';
        }
    }
}

// =============================================
// INSCRIPTION RÉUSSIE → CRÉATION TOKEN + EMAIL + SESSION
// =============================================
if (empty($erreurs)) {
    $token = bin2hex(random_bytes(32));
    $hash  = password_hash($mot_de_passe, PASSWORD_DEFAULT);

    try {
        // Insertion en base
        $stmt = $pdo->prepare("
            INSERT INTO utilisateur 
            (type_compte, nom_prenom, nom_agence, numero, email, mot_de_passe, verification_token, email_verified, created_at, statut)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, NOW(), 'incomplete')
        ");
        $stmt->execute([
            $type_compte,
            $nom_prenom ?: null,
            $nom_agence ?: null,
            $numero,
            $email,
            $hash,
            $token
        ]);

        // Lien de vérification (toujours vers le frontend)
        $link = "http://localhost:5173/confirmation?token=$token";

        // Envoi email
        $mail = new PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'konannguessancyriac0177@gmail.com';
        $mail->Password   = 'xytb npbb tmcp fhlb';
        $mail->SMTPSecure = 'tls';
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';

        $mail->setFrom('konannguessancyriac0177@gmail.com', 'Plateforme Immo');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Vérification de votre compte';
        $mail->Body    = "
            <div style='font-family:Arial,sans-serif;text-align:center;padding:30px;background:#f8f9fa;'>
                <h2 style='color:#0c2b47;'>Bienvenue sur la Plateforme Immo !</h2>
                <p>Un dernier clic pour activer votre compte :</p>
                <a href='$link' style='background:#ff6600;color:#fff;padding:15px 35px;text-decoration:none;border-radius:50px;font-weight:bold;display:inline-block;margin:20px;'>
                    Activer mon compte
                </a>
                <p style='color:#666;font-size:0.9em;'>Ce lien expire dans 1 heure.</p>
            </div>
        ";

        $mail->send();

        // SESSION PHP → pour la page /verif
        $_SESSION['pending_verification'] = [
            'email' => $email,
            'token' => $token,
            'expires' => time() + 3600 // 1 heure
        ];

        echo json_encode(['success' => true, 'message' => 'Inscription réussie, vérifiez votre email.', 'erreurs' => []]);
        exit;

    } catch (Exception $e) {
        $erreurs['general'] = 'Erreur lors de l\'inscription. Réessayez.';
    }
}

// =============================================
// ERREURS → RETOUR JSON
// =============================================
http_response_code(422);
echo json_encode(['success' => false, 'message' => 'Erreur de validation', 'erreurs' => $erreurs]);
exit;