<?php
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

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    echo json_encode(['success' => false, 'erreurs' => ['general' => 'Données invalides']]);
    exit;
}

$identifiant = trim($data['identifiant'] ?? '');
$mot_de_passe = $data['mot_de_passe'] ?? '';

$erreurs = [];

// Validation champs
if (empty($identifiant)) $erreurs['identifiant'] = 'Champ obligatoire';
if (empty($mot_de_passe)) $erreurs['mot_de_passe'] = 'Champ obligatoire';

if (empty($erreurs)) {
    try {
        $stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE email = ? OR numero = ? LIMIT 1");
        $stmt->execute([$identifiant, $identifiant]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Mot de passe incorrect
            if (!password_verify($mot_de_passe, $user['mot_de_passe'])) {
                $erreurs['mot_de_passe'] = 'Mot de passe incorrect.';
            } 
            // Email non vérifié
            elseif ($user['email_verified'] == 0) {
                $erreurs['general'] = 'Veuillez vérifier votre email avant de vous connecter.';
            } 
            else {
                // Connexion réussie
                $_SESSION['user'] = [
                    'id' => $user['id_utilisateur'],
                    'email' => $user['email'],
                    'type_compte' => $user['type_compte'],
                    'nom' => $user['nom_prenom'] ?: $user['nom_agence'],
                    'connected' => true
                ];

                session_write_close();
                echo json_encode([
                    'success' => true,
                    'message' => 'Connexion réussie ! Bienvenue sur votre tableau de bord.'
                ]);
                exit;
            }
        } else {
            $erreurs['identifiant'] = 'Utilisateur non trouvé.';
        }
    } catch (Exception $e) {
        // Log interne du serveur (ne pas envoyer le message brut à l'utilisateur)
        error_log($e->getMessage());
        $erreurs['general'] = 'Erreur serveur. Réessayez plus tard.';
    }
}

// Retour JSON avec toutes les erreurs
echo json_encode(['success' => false, 'erreurs' => $erreurs]);
