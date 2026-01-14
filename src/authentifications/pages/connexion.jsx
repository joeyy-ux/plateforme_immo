// src/pages/Connexion.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaBuilding } from 'react-icons/fa';
import styles from '../css/connexion.module.css';

const Connexion = () => {
  const navigate = useNavigate();
  const identifiantRef = useRef(null);

  const [formData, setFormData] = useState({ identifiant: '', mot_de_passe: '' });
  const [touched, setTouched] = useState({ identifiant: false, mot_de_passe: false });
  const [errors, setErrors] = useState({});
  const [generalMessage, setGeneralMessage] = useState('');
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formatNumero = (raw) => {
    let input = raw.replace(/[^\d+]/g, '');
    if (input.startsWith('+225')) input = input.substring(4);
    else if (input.startsWith('225')) input = input.substring(3);
    input = input.substring(0, 10);
    let formatted = '+225 ';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += input[i];
    }
    return formatted.trimEnd();
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValidNumero = (value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 || (digits.length === 13 && digits.startsWith('225'));
  };

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'identifiant') {
      const hasLetters = /[A-Za-z@_\.-]/.test(value);
      if (hasLetters || value.includes('@')) {
        value = value.replace(/^\+?225\s?/, '').replace(/\s/g, '');
      } else {
        value = formatNumero(value);
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setGeneralMessage('');
    setGeneralSuccess('');
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const value = formData[name];

    if (name === 'identifiant') {
      const trimmed = value.trim();
      if (!trimmed) setErrors(prev => ({ ...prev, identifiant: 'Email ou numéro requis' }));
      else if (!isValidEmail(trimmed) && !isValidNumero(trimmed)) {
        setErrors(prev => ({ ...prev, identifiant: 'Email invalide ou numéro incomplet (10 chiffres)' }));
      }
      if (trimmed === '+225') setFormData(prev => ({ ...prev, identifiant: '' }));
    }

    if (name === 'mot_de_passe' && !value) {
      setErrors(prev => ({ ...prev, mot_de_passe: 'Mot de passe requis' }));
    }
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    if (name === 'identifiant' && (!formData.identifiant || formData.identifiant.trim() === '')) {
      setFormData(prev => ({ ...prev, identifiant: '+225 ' }));
      setTimeout(() => {
        const el = identifiantRef.current;
        if (el && el.setSelectionRange) el.setSelectionRange(5, 5);
      }, 0);
    }
  };

  const isFormValid = () => {
    const id = formData.identifiant.trim();
    const pwd = formData.mot_de_passe;
    if (!id || !pwd) return false;
    return (isValidEmail(id) || isValidNumero(id)) && pwd.length >= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setLoading(true);
    setErrors({});
    setGeneralMessage('');
    setGeneralSuccess('');

    try {
      const res = await axios.post(
        'http://localhost/plateforme_immo/public/api_authentification/connexion.php',
        { identifiant: formData.identifiant, mot_de_passe: formData.mot_de_passe },
        { withCredentials: true }
      );

      if (res.data.success) {
        setGeneralSuccess(res.data.message || 'Connexion réussie !');
        navigate('/dashboard');
      } else if (res.data.erreurs) {
        setErrors(res.data.erreurs);
        Object.keys(res.data.erreurs).forEach(k => setTouched(prev => ({ ...prev, [k]: true })));
        if (res.data.erreurs.general) setGeneralMessage(res.data.erreurs.general);
      }
    } catch (err) {
      console.log('Réponse erreur connexion:', err.response?.data || err);

      if (err.response?.data?.erreurs) {
        setErrors(err.response.data.erreurs);
        Object.keys(err.response.data.erreurs).forEach(k => setTouched(prev => ({ ...prev, [k]: true })));
        if (err.response.data.erreurs.general) setGeneralMessage(err.response.data.erreurs.general);
      } else {
        setErrors({ general: 'Erreur serveur. Réessayez.' });
        setGeneralMessage('Erreur serveur. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.connexion}>
      <div className={styles['container-connexion']}>
        <div className={styles.logo}><FaBuilding /></div>
        <h2 className={styles.title}>Se connecter</h2>

        {generalSuccess && <div className={styles['message-success']}>{generalSuccess}</div>}
        {generalMessage && <div className={styles['message-error']}>{generalMessage}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles['input-connexion-group']}>
            <label className={styles['label-required-connexion']}><FaUser /> Email ou Numéro</label>
            <input
              type="text"
              name="identifiant"
              value={formData.identifiant}
              ref={identifiantRef}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              placeholder="jean@example.com ou 01 23 45 67 89"
              className={touched.identifiant ? (errors.identifiant ? styles['has-error'] : formData.identifiant ? styles.valid : '') : ''}
            />
            {touched.identifiant && errors.identifiant && <div className={styles['error-message']}>{errors.identifiant}</div>}
          </div>

          <div className={styles['input-connexion-group']}>
            <label className={styles['label-required-connexion']}><FaLock /> Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="••••••••"
                className={touched.mot_de_passe ? (errors.mot_de_passe ? styles['has-error'] : formData.mot_de_passe ? styles.valid : '') : ''}
              />
              <span className={styles['password-toggle']} onClick={() => setShowPassword(!showPassword)} aria-hidden="true">
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {touched.mot_de_passe && errors.mot_de_passe && <div className={styles['error-message']}>{errors.mot_de_passe}</div>}
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={!isFormValid() || loading}
            aria-disabled={!isFormValid() || loading}
            style={{ opacity: isFormValid() ? 1 : 0.5, cursor: isFormValid() ? 'pointer' : 'not-allowed' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className={styles['lien-connection']}>
            <a href="/oubli_mdp">Mot de passe oublié ?</a>
            <p>Pas de compte ? <a href="/inscription">Créer un compte</a></p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Connexion;
