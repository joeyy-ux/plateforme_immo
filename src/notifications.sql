USE `plateforme_immo`;

-- Notifications table
CREATE TABLE IF NOT EXISTS notification (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_utilisateur INT NOT NULL,
  titre VARCHAR(255) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  url VARCHAR(512) DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_read (id_utilisateur,is_read),
  FOREIGN KEY (id_utilisateur) REFERENCES utilisateur(id_utilisateur) 
      ON DELETE CASCADE 
      ON UPDATE CASCADE
) 
