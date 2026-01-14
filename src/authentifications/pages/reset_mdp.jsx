/**
 * src/pages/ResetMdp.jsx
 *
 * Page de réinitialisation de mot de passe via token.
 * - Vérifie la présence du token dans l'URL
 * - Affiche les critères de mot de passe en temps réel
 * - Indique la correspondance entre mot de passe / confirmation
 * - Icônes de validation placées à l'intérieur d'un wrapper .inputControl
 * - Accessibilité : aria-invalid / aria-describedby, focus, role / aria-live
 * - Nettoyage des timers pour éviter les fuites
 *
 * NOTE: le fichier CSS attendu est src/styles/ResetMdp.module.css
 */
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaBuilding,
  FaExclamationTriangle,
  FaExclamationCircle,
} from 'react-icons/fa';
import styles from '../css/reset_mdp.module.css';

const ResetMdp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    mot_de_passe: '',
    confirm_password: '',
  });

  const [touched, setTouched] = useState({
    mot_de_passe: false,
    confirm_password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // timeoutRef pour nettoyer le setTimeout utilisé pour la redirection après succès
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!token) {
      setError('Lien invalide ou manquant.');
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [token]);

  // Met à jour les critères de mot de passe et la correspondance
  useEffect(() => {
    const pwd = formData.mot_de_passe || '';
    setPasswordCriteria({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd),
    });

    if (formData.confirm_password.length > 0) {
      setPasswordMatch(pwd === formData.confirm_password);
    } else {
      setPasswordMatch(null);
    }
  }, [formData.mot_de_passe, formData.confirm_password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // reset messages on change
    setError('');
    setSuccess('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    // hide criteria if password emptied
    if (name === 'mot_de_passe' && !formData.mot_de_passe) {
      setShowCriteria(false);
    }
  };

  const isFormValid = () => {
    const allCriteria = Object.values(passwordCriteria).every(Boolean);
    return allCriteria && formData.mot_de_passe === formData.confirm_password && formData.mot_de_passe.length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // safety: mark touched
    setTouched({ mot_de_passe: true, confirm_password: true });

    if (!isFormValid()) return;

    if (!token) {
      setError('Lien invalide. Demandez un nouveau lien.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await axios.post(
        'http://localhost/plateforme_immo/public/api_authentification/reset_mdp.php',
        {
          token,
          mot_de_passe: formData.mot_de_passe,
        },
        { withCredentials: true }
      );

      if (res.data?.success) {
        setSuccess(res.data.message || 'Mot de passe réinitialisé avec succès.');
        // redirection après 3s vers connexion (cleanup géré par timeoutRef)
        timeoutRef.current = setTimeout(() => {
          navigate('/connexion');
        }, 3000);
      } else {
        setError(res.data?.message || 'Erreur lors de la réinitialisation.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lien expiré ou invalide.');
    } finally {
      setLoading(false);
    }
  };

  // Affichage si token absent
  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logo} aria-hidden="true">
            <FaBuilding />
          </div>
          <h2 className={styles.title}>Lien invalide</h2>
          <p className={`${styles.message} ${styles.messageError}`}>
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate('/oubli_mdp')}
              className={styles.btnSecondary}
            >
              Demander un nouveau lien
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo} aria-hidden="true">
          <FaBuilding />
        </div>

        <h2 className={styles.title}>Réinitialiser le mot de passe</h2>

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
          {/* Nouveau mot de passe */}
          <div className={styles['input-group']}>
            <label htmlFor="mot_de_passe" className={styles.label}>
              <FaLock /> Nouveau mot de passe
            </label>

            <div className={`${styles.inputControl} ${styles.relative} ${styles.withToggle}`}>
              <input
                id="mot_de_passe"
                name="mot_de_passe"
                type={showPassword ? 'text' : 'password'}
                value={formData.mot_de_passe}
                onChange={handleChange}
                onFocus={() => setShowCriteria(true)}
                onBlur={handleBlur}
                placeholder="Minimum 8 caractères"
                aria-invalid={touched.mot_de_passe && !Object.values(passwordCriteria).every(Boolean)}
                aria-describedby={touched.mot_de_passe && !Object.values(passwordCriteria).every(Boolean) ? 'pwd-criteria' : undefined}
                className={`${styles.input} ${touched.mot_de_passe ? (Object.values(passwordCriteria).every(Boolean) ? styles.valid : styles['has-error']) : ''}`}
              />

              <button
                type="button"
                className={styles['password-toggle']}
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

              {/* Icônes de validation placées dans le wrapper */}
              {touched.mot_de_passe && Object.values(passwordCriteria).every(Boolean) && (
                <FaCheckCircle className={styles.inputValidIcon} aria-hidden="true" />
              )}
              {touched.mot_de_passe && !Object.values(passwordCriteria).every(Boolean) && formData.mot_de_passe && (
                <FaExclamationCircle className={styles.inputErrorIcon} aria-hidden="true" />
              )}
            </div>

            <ul id="pwd-criteria" className={`${styles['password-criteria']} ${showCriteria ? styles.active : ''}`}>
              <li className={passwordCriteria.length ? styles.valid : ''}>Au moins 8 caractères</li>
              <li className={passwordCriteria.uppercase ? styles.valid : ''}>Une majuscule</li>
              <li className={passwordCriteria.lowercase ? styles.valid : ''}>Une minuscule</li>
              <li className={passwordCriteria.number ? styles.valid : ''}>Un chiffre</li>
              <li className={passwordCriteria.special ? styles.valid : ''}>Un caractère spécial (!@#$%^&*)</li>
            </ul>
          </div>

          {/* Confirmation */}
          <div className={styles['input-group']}>
            <label htmlFor="confirm_password" className={styles.label}>
              <FaLock /> Confirmer le mot de passe
            </label>

            <div className={styles.inputControl}>
              <input
                id="confirm_password"
                name="confirm_password"
                type="password"
                value={formData.confirm_password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Répétez le mot de passe"
                aria-invalid={formData.confirm_password.length > 0 && !passwordMatch}
                aria-describedby={formData.confirm_password.length > 0 && !passwordMatch ? 'confirm-error' : undefined}
                className={`${styles.input} ${formData.confirm_password.length > 0 ? (passwordMatch ? styles.valid : styles['has-error']) : ''}`}
              />

              {/* Icônes de validation */}
              {formData.confirm_password.length > 0 && passwordMatch && (
                <FaCheckCircle className={styles.inputValidIcon} aria-hidden="true" />
              )}
              {formData.confirm_password.length > 0 && !passwordMatch && (
                <FaExclamationCircle className={styles.inputErrorIcon} aria-hidden="true" />
              )}
            </div>

            {formData.confirm_password.length > 0 && (
              passwordMatch ? (
                <div className={styles.matchOk}>Les mots de passe correspondent</div>
              ) : (
                <div id="confirm-error" className={styles['error-message']}>Les mots de passe ne correspondent pas</div>
              )
            )}
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={!isFormValid() || loading}
            aria-disabled={!isFormValid() || loading}
          >
            {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetMdp;