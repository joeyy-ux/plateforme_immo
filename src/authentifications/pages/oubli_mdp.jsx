/**
 * src/pages/OubliMdp.jsx
 *
 * Page "Mot de passe oublié"
 * - Code commenté, lisible et sécurisé
 * - Aucun style inline : tout est dans src/styles/OubliMdp.module.css
 * - Ajout d'un wrapper .inputControl autour de l'input pour positionner
 *   correctement les icônes de validation (check / erreur)
 * - Accessibilité : id/aria-describedby/aria-invalid, role/aria-live pour feedback
 */

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  FaEnvelope,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExclamationCircle,
} from 'react-icons/fa';
import styles from '../css/oubli.module.css';

const OubliMdp = () => {
  const navigate = useNavigate();

  // Valeur de l'input
  const [email, setEmail] = useState('');
  // Marque si le champ a été touché (blur)
  const [touched, setTouched] = useState(false);
  // Loading pour l'envoi
  const [loading, setLoading] = useState(false);
  // Messages de succès / erreur
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Validation basique de l'email
  const isValidEmail = (em) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((em || '').trim());

  const handleChange = (e) => {
    setEmail(e.target.value);
    // Clear messages dès que l'utilisateur modifie la saisie
    setError('');
    setSuccess('');
  };

  const handleBlur = () => {
    setTouched(true);
  };

  // Bouton actif seulement si champ touché et email valide
  const isButtonActive = touched && isValidEmail(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isButtonActive) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(
        'http://localhost/plateforme_immo/public/api_authentification/oubli_mdp.php',
        { email: email.trim() },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setSuccess(res.data.message || 'Un lien de réinitialisation a été envoyé à votre email !');
      } else {
        setError(res.data?.message || 'Aucun compte trouvé avec cet email.');
      }
    } catch (err) {
      // Affiche le message serveur s'il existe, sinon message générique
      setError(
        err.response?.data?.message ||
        'Aucun compte trouvé avec cet email ou erreur serveur.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} role="main" aria-live="polite">
        {/* Logo */}
        <div className={styles.logo} aria-hidden="true">
          <FaBuilding />
        </div>

        <h1 className={styles.title}>Mot de passe oublié ?</h1>

        <p className={styles.lead}>
          Entrez votre adresse email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {/* Messages globaux de succès / erreur */}
        {success && (
          <div className={styles['message-success']} role="status" aria-live="polite">
            <FaCheckCircle className={styles.icon} aria-hidden="true" /> <span>{success}</span>
          </div>
        )}
        {error && (
          <div className={styles['message-error']} role="alert" aria-live="assertive">
            <FaExclamationTriangle className={styles.icon} aria-hidden="true" /> <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles['input-group']}>
            <label htmlFor="email" className={styles.label}><FaEnvelope /> Email</label>

            {/* Input wrapper pour positionner les icônes */}
            <div className={styles.inputControl}>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="votre@email.com"
                aria-invalid={touched && !isValidEmail(email)}
                aria-describedby={touched && !isValidEmail(email) ? 'email-error' : undefined}
                className={`${styles.input} ${touched ? (isValidEmail(email) ? styles.valid : styles['has-error']) : ''}`}
              />

              {/* Icônes de validation : check ou erreur */}
              {touched && isValidEmail(email) && email.length > 0 && (
                <FaCheckCircle className={styles.inputValidIcon} aria-hidden="true" />
              )}
              {touched && !isValidEmail(email) && email.length > 0 && (
                <FaExclamationCircle className={styles.inputErrorIcon} aria-hidden="true" />
              )}
            </div>

            {/* Message d'erreur local sous le champ */}
            {touched && !isValidEmail(email) && email && (
              <div id="email-error" className={styles['error-message']}>
                Veuillez saisir un email valide
              </div>
            )}
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={!isButtonActive || loading}
            aria-disabled={!isButtonActive || loading}
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>

          <div className={styles.links}>
            {/* Utiliser navigate pour éviter full reload */}
            <button
              type="button"
              className={styles.linkButton}
              onClick={() => navigate('/connexion')}
            >
              Retour à la connexion
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OubliMdp;