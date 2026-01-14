// src/pages/Verif.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaPaperPlane, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import styles from '../css/verif.module.css';

const Verif = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Récupérer l'email depuis la session PHP
  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const res = await axios.get('http://localhost/plateforme_immo/public/api_authentification/verif.php', { withCredentials: true });
        setEmail(res.data.email || '');
      } catch (err) {
        navigate('/inscription');
      }
    };
    fetchEmail();
  }, [navigate]);

  // Compteur 60 secondes
  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer(prev => prev - 1), 1000);
      return () => clearTimeout(t);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleResend = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await axios.post('http://localhost/plateforme_immobiliere/public/api_authentification/renvoyer_lien.php', {}, { withCredentials: true });
      setMessage(res.data.message || 'Nouveau lien envoyé !');
      setTimer(60);
      setCanResend(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du renvoi. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  // Masquer une partie de l'email (sécurisé)
  const maskedEmail = email
    ? email.replace(/(.{2}).*(@.*)/, '$1***$2')
    : 'votre e-mail';

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        <div className={styles.logo} aria-hidden="true"><FaShieldAlt /></div>

        <h2 className={styles.title}>Confirmez votre compte</h2>

        {message && (
          <div className={styles['message-success']} role="status" aria-live="polite">
            <FaCheckCircle className={styles.iconSuccess} /> <span>{message}</span>
          </div>
        )}

        {error && (
          <div className={styles['message-error']} role="alert" aria-live="assertive">
            <FaExclamationTriangle className={styles.iconError} /> <span>{error}</span>
          </div>
        )}

        <div className={styles.cardInfo}>
          <p className={styles.lead}>
            Votre compte a été créé avec succès.
            <br />
            Un email contenant un lien de vérification vous a été envoyé à :
          </p>

          <strong className={styles.email}>{maskedEmail}</strong>

          <p className={styles.note} style={{ marginTop: '12px' }}>
            Pour des raisons de sécurité, votre compte restera <span className={styles.inactive}>inactif</span> tant que vous n’aurez pas cliqué sur le lien.
          </p>
        </div>

        <div className={styles.resendBlock}>
          <p className={styles.resendQuestion}>
            <FaPaperPlane className={styles.iconPlane} aria-hidden="true" /> Vous n’avez pas reçu l’email ?
          </p>

          <button
            onClick={handleResend}
            disabled={loading || !canResend}
            className={styles.btn}
            aria-disabled={loading || !canResend}
          >
            {loading ? 'Envoi...' : (canResend ? 'Renvoyer le lien' : `Attendre ${timer}s`)}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Verif;










 
