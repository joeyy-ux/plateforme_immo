-- Table pour stocker les contrats immobiliers
USE `plateforme_immo`;

CREATE TABLE IF NOT EXISTS contrats_immobiliers (
    id_contrat INT AUTO_INCREMENT PRIMARY KEY,
    id_utilisateur INT NOT NULL,
    type_bien VARCHAR(100) NOT NULL,
    type_offre VARCHAR(100) NOT NULL,
    titre_bien VARCHAR(255) NOT NULL,
    ville VARCHAR(100) NOT NULL,
    commune VARCHAR(100),
    quartier VARCHAR(100) NOT NULL,
    prix_bien VARCHAR(100) NOT NULL,
    moyen_paiement VARCHAR(100) NOT NULL,
    montant_verse VARCHAR(100) NOT NULL,
    date_paiement DATE NOT NULL,
    nom_proprietaire VARCHAR(255) NOT NULL,
    tel_proprietaire VARCHAR(20) NOT NULL,
    type_piece_proprietaire VARCHAR(50) NOT NULL,
    numero_piece_proprietaire VARCHAR(100) NOT NULL UNIQUE,
    nom_client VARCHAR(255) NOT NULL,
    tel_client VARCHAR(20) NOT NULL,
    type_piece_client VARCHAR(50) NOT NULL,
    numero_piece_client VARCHAR(100) NOT NULL UNIQUE,
    nom_proprietaire_approbation VARCHAR(255),
    nom_client_approbation VARCHAR(255),
    nom_client_approbation2 VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_contrat_id ON contrats_immobiliers(id_contrat);
CREATE INDEX idx_id_utilisateur ON contrats_immobiliers(id_utilisateur);
CREATE INDEX idx_date_creation ON contrats_immobiliers(date_creation);

CREATE TABLE IF NOT EXISTS biens_conclus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_contrat INT NOT NULL,
    bien_conclu TINYINT(1) NOT NULL DEFAULT 0,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Foreign Key (id_contrat) REFERENCES contrats_immobiliers (id_contrat)
     ON DELETE CASCADE
     ON UPDATE CASCADE
);