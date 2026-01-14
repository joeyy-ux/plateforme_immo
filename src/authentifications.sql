-- Création de la base de données et sélection
CREATE DATABASE IF NOT EXISTS `plateforme_immo` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `plateforme_immo`;

SET FOREIGN_KEY_CHECKS = 0;

-- 3) Création de la table inscription
CREATE TABLE utilisateur (
    id_utilisateur INT AUTO_INCREMENT PRIMARY KEY,
    type_compte VARCHAR(50) NOT NULL,
    nom_prenom VARCHAR(150) NULL,
    nom_agence VARCHAR(150) NULL,
    numero VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    verification_token VARCHAR(255) NULL,
    email_verified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE utilisateur
ADD statut ENUM('incomplete','en attente','verifier') DEFAULT 'incomplete';