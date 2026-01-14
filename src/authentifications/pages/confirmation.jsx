/**
 * src/pages/Confirmation.jsx
 *
 * Page de confirmation d'email (vérification via token URL).
 * - Utilise le module CSS : src/styles/Confirmation.module.css
 * - Robustesse : AbortController + mountedRef pour éviter setState après unmount
 * - Accessibilité : role / aria-live, boutons avec type, labels clairs
 * - Code commenté et lisible
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaCheckCircle,
  FaSignInAlt,
  FaBuilding,
  FaExclamationTriangle,
} from 'react-icons/fa';
import styles from '../css/confirmation.module.css';

const Confirmation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // status: 'loading' | 'success' | 'error'
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  // mountedRef pour éviter setState après démontage
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Lien invalide ou manquant.');
      return;
    }

    const controller = new AbortController();

    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `http://localhost/plateforme_immo/public/api_authentification/confirmation.php?token=${encodeURIComponent(
            token
          )}`,
          {
            withCredentials: true,
            signal: controller.signal,
          }
        );

        if (!mountedRef.current) return;

        const ok = Boolean(res.data?.success);

        if (ok) {
          setStatus('success');
          setMessage(res.data?.message || 'Votre adresse a été vérifiée avec succès.');
        } else {
          setStatus('error');
          setMessage(res.data?.message || 'Erreur lors de la vérification.');
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        if (!mountedRef.current) return;

        setStatus('error');
        setMessage(
          err?.response?.data?.message || 'Erreur de vérification ou problème réseau.'
        );
      }
    };

    verifyEmail();

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  return (
    <div className={styles.page}>
      <div className={styles.card} role="main" aria-live="polite">
        <div className={styles.logo} aria-hidden="true">
          <FaBuilding />
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className={styles.loadingBlock} aria-busy="true">
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.loadingText}>Vérification en cours...</p>
          </div>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className={styles.iconCircle} aria-hidden="true">
              <FaCheckCircle className={styles.iconSuccess} />
            </div>

            <h1 className={styles.title}>Compte validé avec succès !</h1>

            <p className={styles.message}>
              Félicitations ! Votre email a été vérifié avec succès.
            </p>
            <p className={styles.message}>
              Vous pouvez maintenant vous connecter à votre compte.
            </p>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => navigate('/connexion')}
                className={styles.btnPrimary}
                aria-label="Se connecter"
              >
                <FaSignInAlt className={styles.btnIcon} aria-hidden="true" /> Se connecter
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className={styles.iconCircleError} aria-hidden="true">
              <FaExclamationTriangle className={styles.iconError} />
            </div>

            <h1 className={styles.title}>Erreur de vérification</h1>

            <p className={`${styles.message} ${styles.messageError}`}>{message}</p>

            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => navigate('/inscription')}
                className={styles.btnSecondary}
                aria-label="Revenir à l'inscription"
              >
                Revenir à l'inscription
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Confirmation;