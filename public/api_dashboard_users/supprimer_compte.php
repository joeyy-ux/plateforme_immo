<?php
session_start();

header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require '../../src/config_db.php';

if (!isset($_SESSION['user']['id'])) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Utilisateur non connecté']]);
    exit;
}

$id_utilisateur = (int) $_SESSION['user']['id'];

// Read input (supports form-data or JSON)
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isJson = strpos($contentType, 'application/json') !== false;
if ($isJson) {
    $data = json_decode(file_get_contents('php://input'), true);
    $motif = trim($data['motif'] ?? '');
} else {
    $motif = trim($_POST['motif'] ?? '');
}

$errors = [];
if ($motif === '') $errors['motif'] = 'Le motif est obligatoire';
elseif (strlen($motif) < 10) $errors['motif'] = 'Motif trop court (minimum 10 caractères)';
elseif (strlen($motif) > 500) $errors['motif'] = 'Motif trop long (maximum 500 caractères)';
elseif (!preg_match("/^[a-zA-ZÀ-ÿ0-9\s.,;:!?()'\"-]+$/u", $motif)) $errors['motif'] = 'Caractères non autorisés dans le motif';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
}

// Fetch user basic info
$stmt = $pdo->prepare("SELECT * FROM utilisateur WHERE id_utilisateur = ? LIMIT 1");
$stmt->execute([$id_utilisateur]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$user) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Utilisateur introuvable']]);
    exit;
}

$type_compte = $user['type_compte'] ?? '';
$nom_prenom = $user['nom_prenom'] ?? '';
$nom_agence = $user['nom_agence'] ?? '';

// Fetch profile-specific files
if ($type_compte === 'agence') {
    $stmtProfile = $pdo->prepare("SELECT logo_agence AS photo, NULL AS piece_recto, NULL AS piece_verso, NULL AS selfie_verification FROM profil_agence WHERE id_utilisateur = ?");
} elseif ($type_compte === 'demarcheur') {
    $stmtProfile = $pdo->prepare("SELECT photo_image AS photo, piece_recto, piece_verso, selfie_verification FROM profil_demarcheur WHERE id_utilisateur = ?");
} else {
    $stmtProfile = $pdo->prepare("SELECT photo_image AS photo, piece_recto, piece_verso, selfie_verification FROM profil_proprio WHERE id_utilisateur = ?");
}
$stmtProfile->execute([$id_utilisateur]);
$profil = $stmtProfile->fetch(PDO::FETCH_ASSOC) ?: [];

// Prepare archive folder per-user
$ts = time();
$archiveSub = 'compteSupprimer/' . $id_utilisateur . '_' . $ts . '/';
$archiveBase = realpath(__DIR__ . '/../../uploads') ?: __DIR__ . '/../../uploads';
$archiveDir = $archiveBase . '/' . $archiveSub;
if (!is_dir($archiveDir) && !mkdir($archiveDir, 0755, true)) {
    echo json_encode(['success' => false, 'errors' => ['global' => 'Impossible de créer le dossier d\'archive']]);
    exit;
}

// helpers
function safeCopy($sourceFull, $destFull) {
    // prevent copying outside project by normalizing
    $sourceReal = realpath($sourceFull);
    if (!$sourceReal || !is_file($sourceReal)) return false;
    return copy($sourceReal, $destFull);
}

function rrmdir($dir) {
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) rrmdir($path); else @unlink($path);
    }
    @rmdir($dir);
}

// copy profile files into archive/profil/
$copied = ['photo' => null, 'piece_recto' => null, 'piece_verso' => null, 'selfie_verification' => null];
$profilDir = $archiveDir . 'profil/';
@mkdir($profilDir, 0755, true);
foreach ($copied as $k => $_) {
    $rel = $profil[$k] ?? null;
    if (!$rel) continue;
    $sourceCandidates = [];
    $relTrim = ltrim($rel, '/');
    $sourceCandidates[] = __DIR__ . '/../../' . $relTrim;
    $sourceCandidates[] = __DIR__ . '/../../uploads/' . $relTrim;
    $copiedOk = false;
    foreach ($sourceCandidates as $src) {
        if (file_exists($src) && is_file($src)) {
            $dest = $profilDir . basename($src);
            if (safeCopy($src, $dest)) {
                $copied[$k] = $archiveSub . 'profil/' . basename($src);
                $copiedOk = true;
                break;
            }
        }
    }
    if (!$copiedOk) {
        rrmdir($archiveDir);
        echo json_encode(['success' => false, 'errors' => ['global' => 'Erreur lors de la copie des fichiers de profil']]);
        exit;
    }
}

// gather user's biens and copy their photos
$biensToDelete = [];
try {
    $stmtBiens = $pdo->prepare('SELECT id_bien FROM information_generale WHERE id_utilisateur = ?');
    $stmtBiens->execute([$id_utilisateur]);
    $biensToDelete = $stmtBiens->fetchAll(PDO::FETCH_COLUMN);
} catch (Exception $e) {
    rrmdir($archiveDir);
    echo json_encode(['success' => false, 'errors' => ['global' => 'Erreur lecture annonces']]);
    exit;
}

$copiedBiens = [];
foreach ($biensToDelete as $id_bien) {
    $sub = $archiveDir . 'biens/bien_' . $id_bien . '/';
    @mkdir($sub, 0755, true);
    // photo principale
    $stmt = $pdo->prepare('SELECT chemin_photo FROM photo_principale_bien WHERE id_bien = ?');
    $stmt->execute([$id_bien]);
    $pp = $stmt->fetch(PDO::FETCH_ASSOC);
    $chemin = $pp['chemin_photo'] ?? null;
    if ($chemin) {
        $srcCandidates = [__DIR__ . '/../../' . ltrim($chemin, '/'), __DIR__ . '/../../uploads/publieBien/photo_principale/' . basename($chemin)];
        foreach ($srcCandidates as $src) {
            if (file_exists($src) && is_file($src)) {
                $dest = $sub . basename($src);
                if (!safeCopy($src, $dest)) { rrmdir($archiveDir); echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur copie photo principale']]); exit; }
                break;
            }
        }
    }
    // pieces
    $pieceDir = $sub . 'pieces/';
    @mkdir($pieceDir,0755,true);
    $stmtP = $pdo->prepare('SELECT pp.chemin_photo FROM photo_piece pp INNER JOIN piece_bien pb ON pp.id_piece = pb.id_piece WHERE pb.id_bien = ?');
    $stmtP->execute([$id_bien]);
    $photos = $stmtP->fetchAll(PDO::FETCH_COLUMN);
    foreach ($photos as $p) {
        $srcCandidates = [__DIR__ . '/../../' . ltrim($p, '/'), __DIR__ . '/../../uploads/completerProfil/' . basename($p)];
        $found = false;
        foreach ($srcCandidates as $src) {
            if (file_exists($src) && is_file($src)) {
                $dest = $pieceDir . basename($src);
                if (!safeCopy($src, $dest)) { rrmdir($archiveDir); echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur copie photo pièce']]); exit; }
                $found = true; break;
            }
        }
    }
}

// copy historique_bien photos for this user (if any)
try {
    $stmtH = $pdo->prepare('SELECT photo_principale FROM historique_bien WHERE id_utilisateur = ?');
    $stmtH->execute([$id_utilisateur]);
    $histPhotos = $stmtH->fetchAll(PDO::FETCH_COLUMN);
    if (!empty($histPhotos)) {
        $histDir = $archiveDir . 'historique_bien/';
        @mkdir($histDir,0755,true);
        foreach ($histPhotos as $hp) {
            if (!$hp) continue;
            $cands = [__DIR__ . '/../../' . ltrim($hp,'/'), __DIR__ . '/../../uploads/historique_bien/' . basename($hp)];
            foreach ($cands as $src) {
                if (file_exists($src) && is_file($src)) {
                    $dest = $histDir . basename($src);
                    if (!safeCopy($src,$dest)) { rrmdir($archiveDir); echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur copie historique']]); exit; }
                    break;
                }
            }
        }
    }
} catch (Exception $e) {
    rrmdir($archiveDir);
    echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur lecture historique']]);
    exit;
}

// All copies done — insert into compte_supprime
try {
    $stmtIns = $pdo->prepare('INSERT INTO compte_supprime (id_utilisateur,type_compte,nom_prenom,nom_agence,photo,piece_recto,piece_verso,selfie_verification,motif_suppression) VALUES (?,?,?,?,?,?,?,?,?)');
    $photoDb = $copied['photo'] ?? '';
    $stmtIns->execute([
        $id_utilisateur,
        $type_compte,
        $nom_prenom,
        $nom_agence,
        $copied['photo'] ?? '',
        $copied['piece_recto'] ?? null,
        $copied['piece_verso'] ?? null,
        $copied['selfie_verification'] ?? null,
        $motif
    ]);
} catch (Exception $e) {
    rrmdir($archiveDir);
    echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur insertion archive base']]);
    exit;
}

// Now delete DB data for the user (utilisateur row cascades)
try {
    $pdo->beginTransaction();
    $stmtDel = $pdo->prepare('DELETE FROM utilisateur WHERE id_utilisateur = ?');
    $stmtDel->execute([$id_utilisateur]);
    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['success'=>false,'errors'=>['global'=>'Erreur suppression base']]);
    exit;
}

// After DB deletion: remove original files under uploads (publieBien, completerProfil, historique_bien)
$warnings = [];

// delete profile originals
foreach ([$profil['photo'] ?? null, $profil['piece_recto'] ?? null, $profil['piece_verso'] ?? null, $profil['selfie_verification'] ?? null] as $orig) {
    if (!$orig) continue;
    $paths = [__DIR__ . '/../../' . ltrim($orig,'/'), __DIR__ . '/../../uploads/completerProfil/' . basename($orig)];
    $deleted = false;
    foreach ($paths as $p) {
        if (file_exists($p) && is_file($p)) { if (@unlink($p)) { $deleted = true; break; } else { $warnings[] = "Impossible de supprimer: $p"; } }
    }
}

// delete publieBien files (photo_principale and pieces folders)
try {
    foreach ($biensToDelete as $id_bien) {
        // photo principale
        $stmt = $pdo->prepare('SELECT chemin_photo FROM photo_principale_bien WHERE id_bien = ?');
        $stmt->execute([$id_bien]);
        $pp = $stmt->fetch(PDO::FETCH_ASSOC);
        $chemin = $pp['chemin_photo'] ?? null;
        if ($chemin) {
            $p1 = __DIR__ . '/../../' . ltrim($chemin,'/');
            $p2 = __DIR__ . '/../../uploads/publieBien/photo_principale/' . basename($chemin);
            foreach ([$p1,$p2] as $ppath) { if (file_exists($ppath) && is_file($ppath)) { if (!@unlink($ppath)) $warnings[] = "Impossible supprimer: $ppath"; } }
        }
        // pieces directory
        $stmtP = $pdo->prepare('SELECT pp.chemin_photo FROM photo_piece pp INNER JOIN piece_bien pb ON pp.id_piece = pb.id_piece WHERE pb.id_bien = ?');
        $stmtP->execute([$id_bien]);
        $photos = $stmtP->fetchAll(PDO::FETCH_COLUMN);
        $dirs = [];
        foreach ($photos as $ph) { if (preg_match('#^(.+)/[^/]+$#',$ph,$m)) $dirs[$m[1]] = true; }
        foreach (array_keys($dirs) as $d) {
            $full = __DIR__ . '/../../' . $d;
            if (is_dir($full) && strpos(realpath($full), realpath($archiveBase . '/compteSupprimer')) !== 0) {
                rrmdir($full);
            }
        }
    }
} catch (Exception $e) { /* continue */ }

// delete historique_bien files
try {
    $stmtH = $pdo->prepare('SELECT photo_principale FROM historique_bien WHERE id_utilisateur = ?');
    $stmtH->execute([$id_utilisateur]);
    $histPhotos = $stmtH->fetchAll(PDO::FETCH_COLUMN);
    foreach ($histPhotos as $hp) {
        if (!$hp) continue;
        $candidates = [__DIR__ . '/../../' . ltrim($hp,'/'), __DIR__ . '/../../uploads/historique_bien/' . basename($hp)];
        foreach ($candidates as $c) { if (file_exists($c) && is_file($c)) { @unlink($c); } }
    }
} catch (Exception $e) { /* continue */ }

echo json_encode(['success' => true, 'message' => 'Compte supprimé et archivé.', 'archive' => $archiveSub, 'warnings' => $warnings]);
exit;

?>