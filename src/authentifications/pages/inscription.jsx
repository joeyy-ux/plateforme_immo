import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo/logo_immo.jpeg';
import {
  FaUsers,
  FaUser,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle,
} from 'react-icons/fa';
import styles from '../css/inscription.module.css';

/**
 * Page d'inscription
 * - Inputs encapsulés dans un wrapper `inputControl` pour positionner correctement les icônes de validation
 * - Plus d'inline styles (tout est géré via le module CSS)
 * - Accessibilité : id/for sur labels et inputs, button type="button" pour le toggle
 */

/* Regex / constantes */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_SPECIALS = /[!@#$%^&*]/;
const NUMERO_REGEX = /^\+225(?: ?\d{2}){0,5}$/;

const Inscription = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    type_compte: '',
    nom_prenom: '',
    nom_agence: '',
    numero: '',
    email: '',
    mot_de_passe: '',
    confirm_password: '',
    agreeTerms: false,
  });

  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(null);

  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  const validateField = (name, value) => {
    switch (name) {
      case 'type_compte':
        return value ? null : 'Veuillez sélectionner un type de compte.';
      case 'nom_prenom':
        return value.trim() ? null : 'Ce champ est obligatoire.';
      case 'nom_agence':
        return value.trim() ? null : 'Ce champ est obligatoire.';
      case 'numero':
        if (!value) return 'Le numéro est obligatoire.';
        return NUMERO_REGEX.test(value) ? null : 'Format : +225 XX XX XX XX XX';
      case 'email':
        if (!value) return "L'email est obligatoire.";
        return EMAIL_REGEX.test(value) ? null : 'Email invalide.';
      case 'mot_de_passe':
        if (!value) return 'Le mot de passe est obligatoire.';
        if (value.length < 8) return 'Minimum 8 caractères.';
        if (!/[A-Z]/.test(value)) return 'Au moins une majuscule.';
        if (!/[a-z]/.test(value)) return 'Au moins une minuscule.';
        if (!/\d/.test(value)) return 'Au moins un chiffre.';
        if (!PASSWORD_SPECIALS.test(value)) return 'Au moins un caractère spécial (!@#$%^&*).';
        return null;
      case 'agreeTerms':
        return value ? null : "Vous devez accepter les conditions d'utilisation.";
      default:
        return null;
    }
  };

  const isFormValid = () => {
    if (
      !formData.type_compte ||
      !formData.numero ||
      !formData.email ||
      !formData.mot_de_passe ||
      !formData.confirm_password ||
      !formData.agreeTerms
    )
      return false;

    if (formData.type_compte === 'agence' && !formData.nom_agence.trim()) return false;
    if (['proprietaire', 'demarcheur'].includes(formData.type_compte) && !formData.nom_prenom.trim()) return false;

    if (validateField('numero', formData.numero)) return false;
    if (validateField('email', formData.email)) return false;
    if (validateField('mot_de_passe', formData.mot_de_passe)) return false;
    if (formData.mot_de_passe !== formData.confirm_password) return false;

    return true;
  };

  useEffect(() => {
    const pwd = formData.mot_de_passe || '';
    setPasswordCriteria({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /\d/.test(pwd),
      special: PASSWORD_SPECIALS.test(pwd),
    });

    if (formData.confirm_password.length > 0) {
      setPasswordMatch(pwd === formData.confirm_password);
    } else {
      setPasswordMatch(null);
    }
  }, [formData.mot_de_passe, formData.confirm_password]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let filtered = value;

    if (name === 'nom_prenom') filtered = value.replace(/[^A-Za-zÀ-ÿ\s-]/g, '');
    if (name === 'nom_agence') filtered = value.replace(/[^A-Za-z0-9À-ÿ\s-&]/g, '');

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      setErrors((prev) => ({ ...prev, [name]: null }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: filtered }));
      const localErr = validateField(name, filtered);
      setErrors((prev) => {
        const copy = { ...prev };
        if (!localErr) delete copy[name];
        else copy[name] = localErr;
        return copy;
      });
    }
  };

  const handleNumeroChange = (e) => {
    let input = e.target.value.replace(/[^\d+]/g, '');

    if (input.startsWith('+225')) input = input.substring(4);
    else if (input.startsWith('225')) input = input.substring(3);

    input = input.substring(0, 10);

    let formatted = '+225';
    if (input.length > 0) formatted += ' ';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += input[i];
    }

    const trimmed = formatted.trimEnd();

    setFormData((prev) => ({ ...prev, numero: trimmed }));
    setErrors((prev) => {
      const copy = { ...prev };
      const localErr = validateField('numero', trimmed);
      if (!localErr) delete copy.numero;
      else copy.numero = localErr;
      return copy;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, formData[name]) }));
    if (name === 'mot_de_passe' && !formData.mot_de_passe) setShowCriteria(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched(Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {}));

    if (!isFormValid()) return;

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost/plateforme_immo/public/api_authentification/inscription.php',
        formData,
        { withCredentials: true }
      );

      if (response.data.success) {
        navigate('/verif');
      } else {
        setErrors((prev) => ({ ...prev, general: response.data.message || 'Erreur inscription' }));
      }
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.erreurs) {
        setErrors(resp.erreurs);
        setTouched((prev) => {
          const copy = { ...prev };
          Object.keys(resp.erreurs).forEach((k) => (copy[k] = true));
          return copy;
        });
      } else {
        setErrors((prev) => ({ ...prev, general: 'Erreur serveur. Réessayez.' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const showNomPrenom = ['proprietaire', 'demarcheur'].includes(formData.type_compte);
  const showNomAgence = formData.type_compte === 'agence';

  return (
    <div className={styles.inscription}>
      <div className={styles['container-inscription']}>
        <div className={styles.logo}>
          <img src={logo} alt="Logo Plateforme Immobilière" loading="lazy" />
        </div>

        <h2>Créer un compte</h2>

        {errors.general && <div className={styles['error-global']}>{errors.general}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* TYPE DE COMPTE */}
          <div className={styles['input-inscription-group']}>
            <label htmlFor="type_compte" className={styles['label-required-inscription']}>
              <FaUsers /> Type de compte
            </label>

            <div className={styles.inputControl}>
              <select
                id="type_compte"
                name="type_compte"
                value={formData.type_compte}
                onChange={handleChange}
                onBlur={handleBlur}
                className={
                  touched.type_compte
                    ? errors.type_compte
                      ? styles.inputError
                      : formData.type_compte
                      ? styles.inputValid
                      : ''
                    : ''
                }
              >
                <option value="" disabled>
                  Choisissez...
                </option>
                <option value="agence">Agence</option>
                <option value="proprietaire">Propriétaire</option>
                <option value="demarcheur">Démarcheur</option>
              </select>

              {touched.type_compte && !errors.type_compte && formData.type_compte && (
                <FaCheckCircle className={styles.inputValidIcon} />
              )}
              {touched.type_compte && errors.type_compte && <FaExclamationCircle className={styles.inputErrorIcon} />}
            </div>

            {touched.type_compte && !formData.type_compte && <div className={styles['error-message']}>Champ obligatoire</div>}
          </div>

          {/* NOM & PRÉNOM (conditionnel) */}
          {showNomPrenom && (
            <div className={styles['input-inscription-group']}>
              <label htmlFor="nom_prenom" className={styles['label-required-inscription']}>
                <FaUser /> Nom & Prénom
              </label>

              <div className={styles.inputControl}>
                <input
                  id="nom_prenom"
                  type="text"
                  name="nom_prenom"
                  value={formData.nom_prenom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ex: Konan N'Guessan"
                  className={`${touched.nom_prenom && !formData.nom_prenom.trim() ? styles.inputError : formData.nom_prenom.trim() ? styles.inputValid : ''} ${styles.lessRounded}`.trim()}
                />
                {touched.nom_prenom && !errors.nom_prenom && formData.nom_prenom.trim() && <FaCheckCircle className={styles.inputValidIcon} />}
                {touched.nom_prenom && errors.nom_prenom && <FaExclamationCircle className={styles.inputErrorIcon} />}
              </div>

              {touched.nom_prenom && !formData.nom_prenom.trim() && <div className={styles['error-message']}>Champ obligatoire</div>}
            </div>
          )}

          {/* NOM AGENCE (conditionnel) */}
          {showNomAgence && (
            <div className={styles['input-inscription-group']}>
              <label htmlFor="nom_agence" className={styles['label-required-inscription']}>
                <FaBuilding /> Nom de l'agence
              </label>

              <div className={styles.inputControl}>
                <input
                  id="nom_agence"
                  type="text"
                  name="nom_agence"
                  value={formData.nom_agence}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Ex: Agence Prestige"
                  className={`${touched.nom_agence && !formData.nom_agence.trim() ? styles.inputError : formData.nom_agence.trim() ? styles.inputValid : ''} ${styles.lessRounded}`.trim()}
                />
                {touched.nom_agence && !errors.nom_agence && formData.nom_agence.trim() && <FaCheckCircle className={styles.inputValidIcon} />}
                {touched.nom_agence && errors.nom_agence && <FaExclamationCircle className={styles.inputErrorIcon} />}
              </div>

              {touched.nom_agence && !formData.nom_agence.trim() && <div className={styles['error-message']}>Champ obligatoire</div>}
            </div>
          )}

          {/* NUMÉRO */}
          <div className={styles['input-inscription-group']}>
            <label htmlFor="numero" className={styles['label-required-inscription']}>
              <FaPhone /> Numéro
            </label>

            <div className={styles.inputControl}>
              <input
                id="numero"
                type="text"
                name="numero"
                value={formData.numero}
                onChange={handleNumeroChange}
                onBlur={handleBlur}
                placeholder="+225 XX XX XX XX XX"
                className={`${touched.numero ? (errors.numero ? styles.inputError : formData.numero.length >= 7 ? styles.inputValid : styles.inputError) : ''} ${styles.lessRounded}`.trim()}
              />
              {touched.numero && !errors.numero && formData.numero && formData.numero.length >= 7 && <FaCheckCircle className={styles.inputValidIcon} />}
              {touched.numero && errors.numero && <FaExclamationCircle className={styles.inputErrorIcon} />}
            </div>

            {touched.numero && errors.numero && <div className={styles['error-message']}>{errors.numero}</div>}
          </div>

          {/* EMAIL */}
          <div className={styles['input-inscription-group']}>
            <label htmlFor="email" className={styles['label-required-inscription']}>
              <FaEnvelope /> Email
            </label>

            <div className={styles.inputControl}>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="exemple@domaine.com"
                className={touched.email ? (errors.email ? styles.inputError : formData.email ? styles.inputValid : styles.inputError) : ''}
              />
              {touched.email && !errors.email && formData.email && <FaCheckCircle className={styles.inputValidIcon} />}
              {touched.email && errors.email && <FaExclamationCircle className={styles.inputErrorIcon} />}
            </div>

            {touched.email && errors.email && <div className={styles['error-message']}>{errors.email}</div>}
          </div>

          {/* MOT DE PASSE */}
          <div className={styles['input-inscription-group']}>
            <label htmlFor="mot_de_passe" className={styles['label-required-inscription']}>
              <FaLock /> Mot de passe
            </label>

            <div className={`${styles.inputControl} ${styles.withToggle}`}>
              <input
                id="mot_de_passe"
                type={showPassword ? 'text' : 'password'}
                name="mot_de_passe"
                value={formData.mot_de_passe}
                onChange={handleChange}
                onFocus={() => setShowCriteria(true)}
                onBlur={(e) => handleBlur(e)}
                placeholder="Minimum 8 caractères"
                className={touched.mot_de_passe ? (errors.mot_de_passe ? styles.inputError : Object.values(passwordCriteria).every(Boolean) ? styles.inputValid : styles.inputError) : ''}
              />

              <button
                type="button"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className={styles['password-toggle']}
                onClick={() => setShowPassword((s) => !s)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

              {touched.mot_de_passe && !errors.mot_de_passe && Object.values(passwordCriteria).every(Boolean) && <FaCheckCircle className={styles.inputValidIcon} />}
              {touched.mot_de_passe && errors.mot_de_passe && <FaExclamationCircle className={styles.inputErrorIcon} />}
            </div>

            <ul className={`${styles['password-criteria']} ${showCriteria ? styles.active : ''}`}>
              <li className={passwordCriteria.length ? styles.criteriaValid : ''}>Au moins 8 caractères</li>
              <li className={passwordCriteria.uppercase ? styles.criteriaValid : ''}>Une majuscule</li>
              <li className={passwordCriteria.lowercase ? styles.criteriaValid : ''}>Une minuscule</li>
              <li className={passwordCriteria.number ? styles.criteriaValid : ''}>Un chiffre</li>
              <li className={passwordCriteria.special ? styles.criteriaValid : ''}>Un caractère spécial (!@#$%^&*)</li>
            </ul>

            {touched.mot_de_passe && errors.mot_de_passe && <div className={styles['error-message']}>{errors.mot_de_passe}</div>}
          </div>

          {/* CONFIRMER MOT DE PASSE */}
          <div className={styles['input-inscription-group']}>
            <label htmlFor="confirm_password" className={styles['label-required-inscription']}>
              <FaLock /> Confirmer le mot de passe
            </label>

            <div className={styles.inputControl}>
              <input
                id="confirm_password"
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Répétez le mot de passe"
                className={formData.confirm_password.length > 0 ? (passwordMatch === true ? styles.inputValid : styles.inputError) : ''}
              />
              {formData.confirm_password.length > 0 && passwordMatch === true && <FaCheckCircle className={styles.inputValidIcon} />}
              {formData.confirm_password.length > 0 && passwordMatch === false && <FaExclamationCircle className={styles.inputErrorIcon} />}
            </div>

            {formData.confirm_password.length > 0 && (
              passwordMatch === true ? (
                <div className={styles.passwordMatch}>Les mots de passe correspondent</div>
              ) : (
                <div className={styles['error-message']}>Les mots de passe ne correspondent pas</div>
              )
            )}
          </div>

          {/* CHECKBOX TERMS */}
          <div className={styles['input-inscription-group']}>
            <label className={styles['checkbox-label']} htmlFor="agreeTerms">
              <input
                id="agreeTerms"
                type="checkbox"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                onBlur={handleBlur}
                className={styles.checkbox}
              />
              <span className={styles['custom-box']} aria-hidden="true" />
              <span className={styles['checkbox-text']}>J'accepte les conditions d'utilisation</span>
            </label>

            {touched.agreeTerms && !formData.agreeTerms && <div className={styles['checkbox-error']}>Vous devez accepter les conditions.</div>}
          </div>

          <button type="submit" className={styles.btn} disabled={!isFormValid() || loading}>
            {loading ? 'Création en cours...' : 'Créer le compte'}
          </button>

          <div className={styles['have-account']}>
            Vous avez déjà un compte ? <Link to="/connexion">Se connecter</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inscription;