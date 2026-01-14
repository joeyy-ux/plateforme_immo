<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

try {
    // Récupérer les 8 premiers biens validés avec leurs informations (incluant propriétaire et frais de visite)
    $stmt = $pdo->prepare("
        SELECT
            ig.id_bien,
            ig.titre,
            ig.type_bien,
            ig.type_offre,
            ig.prix_bien,
            ig.statut_bien,
            ig.date_publication,
            ig.frais_visite,
            ig.prix_visite,
            lb.ville,
            lb.commune,
            pp.chemin_photo AS photo_principale,
            u.id_utilisateur,
            u.type_compte,
            u.nom_prenom,
            u.nom_agence,
            pa.logo_agence,
            pd.photo_image AS demarcheur_photo,
            ppo.photo_image AS proprio_photo
        FROM information_generale ig
        LEFT JOIN localisation_bien lb ON ig.id_bien = lb.id_bien
        LEFT JOIN photo_principale_bien pp ON ig.id_bien = pp.id_bien
        LEFT JOIN utilisateur u ON ig.id_utilisateur = u.id_utilisateur
        LEFT JOIN profil_agence pa ON u.id_utilisateur = pa.id_utilisateur
        LEFT JOIN profil_demarcheur pd ON u.id_utilisateur = pd.id_utilisateur
        LEFT JOIN profil_proprio ppo ON u.id_utilisateur = ppo.id_utilisateur
        WHERE ig.statut_bien = 'publie'
        ORDER BY ig.date_publication DESC
        LIMIT 8
    ");
    $stmt->execute();
    $biens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Transformer les données pour le frontend
    $properties = [];
    $baseUrl = 'http://localhost/projet_plateforme/';
    foreach ($biens as $bien) {
        $photoPath = $bien['photo_principale'];
        if ($photoPath) {
            $photoPath = trim($photoPath);
            if (stripos($photoPath, 'http') === 0 || stripos($photoPath, '//') === 0) {
                $photoUrl = $photoPath;
            } elseif (stripos($photoPath, 'uploads') === 0) {
                $photoUrl = $baseUrl . ltrim($photoPath, '/');
            } else {
                $photoUrl = $baseUrl . 'uploads/publieBien/' . ltrim($photoPath, '/');
            }
        } else {
            $photoUrl = $baseUrl . 'src/assets/logo/logo_immo.jpeg';
        }

        // Normaliser type d'offre et prix
        $typeOffreRaw = isset($bien['type_offre']) ? strtolower(trim($bien['type_offre'])) : '';
        if ($typeOffreRaw === 'vente') $typeOffreRaw = 'vendre';
        if ($typeOffreRaw === 'location') $typeOffreRaw = 'louer';

        $prixRaw = isset($bien['prix_bien']) ? trim($bien['prix_bien']) : '';
        // Extraire uniquement les chiffres pour envoyer un nombre propre
        $prixDigits = preg_replace('/\D+/', '', $prixRaw);
        $prixValue = $prixDigits !== '' ? (int)$prixDigits : null;

        // Construire photo du propriétaire (logo agence / photo démarcheur / photo proprio)
        $ownerPhotoPath = $bien['logo_agence'] ?? $bien['demarcheur_photo'] ?? $bien['proprio_photo'] ?? null;
        if ($ownerPhotoPath) {
            $ownerPhotoPath = trim($ownerPhotoPath);
            if (stripos($ownerPhotoPath, 'http') === 0 || stripos($ownerPhotoPath, '//') === 0) {
                $ownerPhotoUrl = $ownerPhotoPath;
            } elseif (stripos($ownerPhotoPath, 'uploads') === 0) {
                $ownerPhotoUrl = $baseUrl . ltrim($ownerPhotoPath, '/');
            } else {
                $ownerPhotoUrl = $baseUrl . 'uploads/completerProfil/' . ltrim($ownerPhotoPath, '/');
            }
        } else {
            $ownerPhotoUrl = $baseUrl . 'src/assets/logo/logo_immo.jpeg';
        }

        // Nom affiché du propriétaire: si agence -> nom_agence sinon nom_prenom
        $ownerName = '';
        if (!empty($bien['type_compte']) && strtolower($bien['type_compte']) === 'agence') {
            $ownerName = $bien['nom_agence'] ?: $bien['nom_prenom'] ?: '';
        } else {
            $ownerName = $bien['nom_prenom'] ?: $bien['nom_agence'] ?: '';
        }

        // Label du type de compte
        $typeCompteRaw = isset($bien['type_compte']) ? strtolower(trim($bien['type_compte'])) : '';
        if ($typeCompteRaw === 'agence') $typeCompteLabel = 'Agence immobilière';
        elseif ($typeCompteRaw === 'demarcheur') $typeCompteLabel = 'Démarcheur';
        else $typeCompteLabel = ucfirst($typeCompteRaw ?: 'Particulier');

        $properties[] = [
            'id' => (int) $bien['id_bien'],
            'titre' => $bien['titre'] ?? '',
            'photo' => $photoUrl,
            'typeBien' => $bien['type_bien'],
            'typeOffre' => $typeOffreRaw,
            'ville' => $bien['ville'] ?: '',
            'commune' => $bien['commune'] ?: '',
            'prix' => $prixValue,
            'date' => $bien['date_publication'] ?? null,
            'frais_visite' => isset($bien['frais_visite']) ? $bien['frais_visite'] : null,
            'prix_visite' => isset($bien['prix_visite']) ? $bien['prix_visite'] : null,
            'owner' => [
                'id' => isset($bien['id_utilisateur']) ? (int)$bien['id_utilisateur'] : null,
                'name' => $ownerName,
                'photo' => $ownerPhotoUrl,
                'type_compte' => $typeCompteLabel
            ]
        ];
    }

    if (empty($properties)) {
        echo json_encode([
            'success' => true,
            'message' => 'Aucun bien disponible pour le moment',
            'properties' => []
        ]);
    } else {
        echo json_encode([
            'success' => true,
            'properties' => $properties
        ]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    error_log('get_properties.php PDO ERROR: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur'
    ]);
}
?>