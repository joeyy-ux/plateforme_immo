USE `plateforme_immo`;
CREATE TABLE profil_agence (
    id_utilisateur INT PRIMARY KEY,
    adresse_siege VARCHAR(255) NOT NULL,
    nif VARCHAR(20),
    rccm VARCHAR(30),
    annee_experience INT,
    description_agence TEXT NOT NULL,
    logo_agence VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE profil_demarcheur (
    id_utilisateur INT PRIMARY KEY,
    adresse_personnelle VARCHAR(255) NOT NULL,
    piece_recto VARCHAR(255) NOT NULL,
    piece_verso VARCHAR(255) NOT NULL,
    selfie_verification VARCHAR(255) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    nom_contact VARCHAR(255),
    contact_telephone VARCHAR(20),
    description_demarcheur TEXT NOT NULL,
    photo_image VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE profil_proprio (
    id_utilisateur INT PRIMARY KEY,
    adresse_personnelle VARCHAR(255) NOT NULL,
    piece_recto VARCHAR(255) NOT NULL,
    piece_verso VARCHAR(255) NOT NULL,
    selfie_verification VARCHAR(255) NOT NULL,
    description_proprio TEXT NOT NULL,
    photo_image VARCHAR(255) NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE TABLE message (
    id_message INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL, -- destinataire
    nom_expediteur VARCHAR(150) NOT NULL,
    email_expediteur VARCHAR(150) NOT NULL,
    contenu TEXT NOT NULL,
    date_message TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



CREATE TABLE information_generale (
    id_bien INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,

    type_bien VARCHAR(255) NOT NULL,       -- Appartement, Maison, Terrain…
    type_offre VARCHAR(100) NOT NULL,      -- Vente / Location

    statut VARCHAR(100) NOT NULL DEFAULT 'Non applicable',
    meuble VARCHAR(100) NOT NULL DEFAULT 'Non applicable',
    disponibilite VARCHAR(255) NOT NULL DEFAULT 'Non applicable',

    surface VARCHAR(100),                  -- ex: "300 m²", texte libre
    prix_bien VARCHAR(255) NOT NULL,       -- prix tel que saisi

    frais_visite VARCHAR(100) NOT NULL,    -- Oui / Non
    prix_visite VARCHAR(100),              -- texte libre si Oui

    titre TEXT NOT NULL,
    description TEXT,

    statut_bien ENUM('en attente','publie','suspendu','supprime')
        DEFAULT 'en attente',

    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_utilisateur(id_utilisateur),
    FOREIGN KEY (id_utilisateur)
        REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);






CREATE TABLE localisation_bien (
    id_bien INT PRIMARY KEY,
    ville VARCHAR(150) NOT NULL,
    commune VARCHAR(150),
    quartier VARCHAR(150) NOT NULL,

    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);





CREATE TABLE caracteristique_interieure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    titre TEXT,
    description TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);

CREATE TABLE caracteristique_exterieure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    valeur TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);




CREATE TABLE document_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    nom_document TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);




CREATE TABLE accessibilite_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    nom_accessibilite TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);





CREATE TABLE commodite_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    nom_commodite TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);






CREATE TABLE condition_paiement_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    condition_text TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);






CREATE TABLE bonus_bien (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,

    bonus_text TEXT,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);





CREATE TABLE piece_bien (
    id_piece INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,
    nom_piece VARCHAR(255) NOT NULL,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);






CREATE TABLE photo_piece (
    id_photo INT AUTO_INCREMENT PRIMARY KEY,
    id_piece INT NOT NULL,
    chemin_photo VARCHAR(255) NOT NULL,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_piece)
        REFERENCES piece_bien(id_piece)
        ON DELETE CASCADE
);





CREATE TABLE photo_principale_bien (
    id_bien INT PRIMARY KEY,
    chemin_photo VARCHAR(255) NOT NULL,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);





CREATE TABLE video_bien (
    id_bien INT PRIMARY KEY,
    plateforme VARCHAR(100) NOT NULL,
    lien_video VARCHAR(255) NOT NULL,

    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_bien)
        REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);









-- Désactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS
    photo_piece,
    piece_bien,
    photo_principale_bien,
    video_bien,
    bonus_bien,
    condition_paiement_bien,
    commodite_bien,
    accessibilite_bien,
    document_bien,
    caracteristique_exterieure,
    caracteristique_interieure,
    localisation_bien,
    information_generale;

-- Réactiver les contraintes
SET FOREIGN_KEY_CHECKS = 1;

-- Supprimer l'ancienne table historique_bien si elle existe
DROP TABLE IF EXISTS historique_bien;

-- Créer la nouvelle table historique_bien adaptée à information_generale
CREATE TABLE historique_bien (
    id_historique INT AUTO_INCREMENT PRIMARY KEY,
    id_bien INT NOT NULL,
    id_utilisateur INT NOT NULL,
    -- Champs de information_generale
    type_bien VARCHAR(255) NOT NULL,
    type_offre VARCHAR(100) NOT NULL,
    statut VARCHAR(100) NOT NULL DEFAULT 'Non applicable',
    meuble VARCHAR(100) NOT NULL DEFAULT 'Non applicable',
    disponibilite VARCHAR(255) NOT NULL DEFAULT 'Non applicable',
    surface VARCHAR(100),
    prix_bien VARCHAR(255) NOT NULL,
    frais_visite VARCHAR(100) NOT NULL,
    prix_visite VARCHAR(100),
    titre TEXT NOT NULL,
    description TEXT,
    statut_bien ENUM('en attente','publie','suspendu','supprime') DEFAULT 'supprime',
    date_publication TIMESTAMP,
-- Photo principale (comme dans photo_principale_bien)
    photo_principale VARCHAR(255),
    -- Motif de suppression
    motif TEXT NOT NULL,
    -- Date de suppression automatique
    date_suppression TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Index pour optimiser les recherches
    INDEX idx_utilisateur(id_utilisateur),
    INDEX idx_date_suppression(date_suppression),
    FOREIGN KEY (id_bien) REFERENCES information_generale(id_bien)
        ON DELETE CASCADE
);


CREATE TABLE compte_supprime (
    id_compte_supprime INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    type_compte VARCHAR(50) NOT NULL,
    nom_prenom VARCHAR(150) NOT NULL,
    nom_agence VARCHAR(150) NOT NULL,
    photo VARCHAR(255) NOT NULL,           -- logo pour agence ou photo pour autres
    piece_recto VARCHAR(255)  NULL,          -- uniquement pour démarcheur/propriétaire
    piece_verso VARCHAR(255)  NULL,          -- idem
    selfie_verification VARCHAR(255)  NULL,  -- idem
    motif_suppression TEXT NOT NULL,                     -- raison de la suppression
    date_suppression TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);