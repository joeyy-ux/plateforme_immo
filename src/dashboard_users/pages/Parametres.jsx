// Parametres.jsx - Version améliorée avec validations cohérentes
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash, FaCamera, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import styles from './parametres.module.css';

/* ======================================================
   FORMAT DATE FR (ex: 5 novembre 2025)
====================================================== */
function formatDateFR(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/* ======================================================
   HOOK MESSAGE GLOBAL
====================================================== */
function useGlobalMessage() {
  const [message, setMessage] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!message) return;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(t);
  }, [message]);

  return { message, setMessage, ref };
}

/* ======================================================
   FORMAT NUMÉRO (Même que Inscription.jsx)
====================================================== */
function formatNumero(value) {
  let input = value.replace(/[^\d+]/g, '');
  
  if (input.startsWith('+225')) input = input.substring(4);
  else if (input.startsWith('225')) input = input.substring(3);
  
  input = input.substring(0, 10);
  
  let formatted = '+225 ';
  for (let i = 0; i < input.length; i++) {
    if (i > 0 && i % 2 === 0) formatted += ' ';
    formatted += input[i];
  }
  
  return formatted.trimEnd();
}

/* ======================================================
   PAGE PARAMÈTRES PRINCIPALE
====================================================== */
export default function Parametres() {
  const [activeTab, setActiveTab] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const global = useGlobalMessage();

  useEffect(() => {
    axios.post(
      'http://localhost/plateforme_immo/public/api_dashboard_users/parametres.php',
      {},
      { withCredentials: true }
    )
      .then(res => {
        if (res.data?.success) setUser(res.data);
        else global.setMessage({ type: 'error', text: 'Impossible de charger les paramètres.' });
      })
      .catch(() => global.setMessage({ type: 'error', text: 'Erreur réseau.' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.containerLoading}>
      <div className={styles.spinner}></div>
      <p>Chargement...</p>
    </div>
  );
  
  if (!user) return <div className={styles.error}>Utilisateur introuvable</div>;

  return (
    <div className={styles['container-parametres']}>
      {global.message && (
        <div
          ref={global.ref}
          className={`${styles.message} ${global.message.type === 'success' ? styles.successMsg : styles.errorMsg}`}
        >
          {global.message.text}
        </div>
      )}

      <div className={styles['parametres-card']}>
        <nav className={styles.tabs}>
          <button 
            onClick={() => setActiveTab(0)} 
            className={activeTab === 0 ? styles.active : ''}
          >
            Informations
          </button>
          <button 
            onClick={() => setActiveTab(1)} 
            className={activeTab === 1 ? styles.active : ''}
          >
            Sécurité
          </button>
          <button 
            onClick={() => setActiveTab(2)} 
            className={activeTab === 2 ? styles.active : ''}
          >
            Gestion
          </button>
        </nav>

        {activeTab === 0 && (
          <>
            <NonEditableInfo user={user} />
            <EditableProfile user={user} global={global} />
          </>
        )}

        {activeTab === 1 && <PasswordPanel global={global} />}
        {activeTab === 2 && <DeleteAccountPanel global={global} />}
      </div>
    </div>
  );
}

/* ======================================================
   INFORMATIONS NON MODIFIABLES
====================================================== */
function NonEditableInfo({ user }) {
  return (
    <section className={`${styles.box} ${styles.readOnlyBox}`}>
      <h2 className={styles.boxTitle}>
        <FaCheckCircle /> Informations non modifiables
      </h2>

      <ReadOnly label="Email" value={user.email} />
      <ReadOnly label="Type de compte" value={user.type_compte} />
      <ReadOnly label="Date d'inscription" value={formatDateFR(user.created_at)} />

      {user.type_compte === 'agence' && (
        <>
          {user.nif && <ReadOnly label="NIF" value={user.nif} />}
          {user.rccm && <ReadOnly label="RCCM" value={user.rccm} />}
        </>
      )}

      <div className={styles.readOnlyHint}>
        Ces informations sont verrouillées pour des raisons de sécurité et légales.
      </div>
    </section>
  );
}

function ReadOnly({ label, value }) {
  return (
    <div className={styles.readOnlyField}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      <span className={styles.lock}>🔒</span>
    </div>
  );
}

/* ======================================================
   INFORMATIONS MODIFIABLES - VERSION AMÉLIORÉE
====================================================== */
function EditableProfile({ user, global }) {
  const photoRef = useRef();
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);

  const initialForm = {
    nom_prenom: user.profil?.nom_prenom || '',
    nom_agence: user.profil?.nom_agence || '',
    numero: user.profil?.numero || '+225 ',
    statut: user.profil?.statut || '',
    fonction: user.profil?.fonction || '',
    numero_fonction: user.profil?.numero_fonction || '+225 ',
    adresse: user.profil?.adresse || '',
    description: user.profil?.description || '',
    photo: null,
    photoPreview: user.profil?.photo_url || ''
  };

  const [form, setForm] = useState(initialForm);

  /* VALIDATIONS COHÉRENTES */
  const validateField = (name, value) => {
    switch (name) {
      case 'nom_prenom':
        if (user.type_compte !== 'agence') {
          if (!value.trim()) return 'Ce champ est obligatoire.';
          if (!/^[A-Za-zÀ-ÿ\s-]+$/.test(value)) return 'Caractères non autorisés.';
        }
        return null;
        
      case 'nom_agence':
        if (user.type_compte === 'agence') {
          if (!value.trim()) return 'Ce champ est obligatoire.';
          if (!/^[A-Za-z0-9À-ÿ\s-&]+$/.test(value)) return 'Caractères non autorisés.';
        }
        return null;
        
      case 'numero':
        if (!value) return 'Le numéro est obligatoire.';
        return /^\+225( \d{2}){0,5}$/.test(value) || value === '+225 ' ? null : 'Format : +225 XX XX XX XX XX';
        
      case 'numero_fonction':
        if ((form.statut === 'rattache' || form.statut === 'proprietaire') && user.type_compte === 'demarcheur') {
          if (!value) return 'Le numéro est obligatoire.';
          return /^\+225( \d{2}){0,5}$/.test(value) || value === '+225 ' ? null : 'Format : +225 XX XX XX XX XX';
        }
        return null;
        
      case 'adresse':
        if (!value.trim()) return 'L\'adresse est obligatoire.';
        if (value.trim().length < 5) return 'Trop courte (min 5).';
        if (value.trim().length > 100) return 'Trop longue (max 100).';
        if (!/^[\p{L}0-9\s,.\-']+$/u.test(value)) return 'Caractères non autorisés.';
        return null;
        
      case 'description':
        if (!value.trim()) return 'Description obligatoire.';
        if (value.trim().length < 20) return 'Trop courte (min 20).';
        if (value.trim().length > 500) return 'Trop longue (max 500).';
        return null;
        
      case 'statut':
        if (user.type_compte === 'demarcheur' && !value) return 'Sélection obligatoire.';
        return null;
        
      case 'fonction':
        if ((form.statut === 'rattache' || form.statut === 'proprietaire') && user.type_compte === 'demarcheur') {
          if (!value.trim()) return 'Nom obligatoire.';
        }
        return null;
        
      case 'photo':
        if (!value) return null;
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(value.type))
          return 'Format image invalide (jpg, png, webp).';
        if (value.size > 2 * 1024 * 1024)
          return 'Image trop lourde (max 2Mo).';
        return null;
        
      default:
        return null;
    }
  };

  /* VÉRIFICATION DE LA VALIDITÉ DU FORMULAIRE */
  const isFormValid = () => {
    const fieldsToValidate = ['numero', 'adresse', 'description'];
    
    if (user.type_compte !== 'agence') fieldsToValidate.push('nom_prenom');
    if (user.type_compte === 'agence') fieldsToValidate.push('nom_agence');
    if (user.type_compte === 'demarcheur') fieldsToValidate.push('statut');
    if ((form.statut === 'rattache' || form.statut === 'proprietaire') && user.type_compte === 'demarcheur') {
      fieldsToValidate.push('fonction', 'numero_fonction');
    }
    if (form.photo) fieldsToValidate.push('photo');

    return fieldsToValidate.every(field => !validateField(field, form[field]));
  };

  /* HANDLERS AMÉLIORÉS */
  const handleChange = (e) => {
    const { name, value } = e.target;
    let filteredValue = value;
    
    // Formatage du numéro comme dans Inscription.jsx
    if (name === 'numero' || name === 'numero_fonction') {
      filteredValue = formatNumero(value);
    }

    const newForm = { ...form, [name]: filteredValue };
    setForm(newForm);
    
    // Validation immédiate
    const error = validateField(name, filteredValue);
    setErrors(prev => ({ ...prev, [name]: error }));
    
    // Mark as touched
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleNumeroChange = (e) => {
    const { name, value } = e.target;
    const formatted = formatNumero(value);
    
    setForm(prev => ({ ...prev, [name]: formatted }));
    setErrors(prev => ({ ...prev, [name]: null }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, form[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const err = validateField('photo', file);
    setErrors(prev => ({ ...prev, photo: err }));
    if (err) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({ ...f, photo: file, photoPreview: ev.target.result }));
    };
    reader.readAsDataURL(file);
    setTouched(prev => ({ ...prev, photo: true }));
  };

  /* COMMENCER L'ÉDITION - VALIDER LES CHAMPS PRÉ-REMPIS */
  const startEditing = () => {
    setEditing(true);
    // Valider tous les champs pré-remplis et les marquer comme touchés pour afficher les bordures vertes
    const allTouched = {};
    const newErrors = {};
    
    Object.keys(form).forEach(key => {
      if (key !== 'photoPreview') {
        allTouched[key] = true;
        const error = validateField(key, form[key]);
        if (error) newErrors[key] = error;
      }
    });
    
    setTouched(allTouched);
    setErrors(newErrors);
  };

  /* SUBMIT COHÉRENT AVEC LES AUTRES FORMULAIRES */
  const submit = async (e) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    const allTouched = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    // Valider tous les champs
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      global.setMessage({ type: 'error', text: 'Veuillez corriger les erreurs avant de soumettre.' });
      return;
    }

    setLoading(true);
    const data = new FormData();
    
    Object.entries(form).forEach(([key, value]) => {
      if (value && key !== 'photoPreview') {
        data.append(key, value);
      }
    });

    try {
      const res = await axios.post(
        'http://localhost/plateforme_immobiliere/public/api_dashboard_users/modifier_profil.php',
        data,
        { 
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000
        }
      );

      if (res.data?.success) {
        global.setMessage({ type: 'success', text: res.data.message });
        setEditing(false);
        // Réinitialiser les états
        setForm(initialForm);
        setErrors({});
        setTouched({});
      } else if (res.data?.errors) {
        // set field errors and mark those fields as touched so UI shows red borders
        setErrors(res.data.errors);
        const t = {};
        Object.keys(res.data.errors).forEach(k => { t[k] = true; });
        setTouched(prev => ({ ...prev, ...t }));
        global.setMessage({ type: 'error', text: 'Erreurs dans le formulaire.' });
      } else {
        global.setMessage({ type: 'error', text: 'Erreur lors de la mise à jour.' });
      }
    } catch (error) {
      console.error('Erreur serveur:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        global.setMessage({ type: 'error', text: 'Session expirée. Veuillez vous reconnecter.' });
      } else {
        global.setMessage({ type: 'error', text: 'Erreur serveur. Réessayez plus tard.' });
      }
    } finally {
      setLoading(false);
    }
  };

  /* CLASSES POUR LES CHAMPS */
  const getInputClassName = (fieldName) => {
    if (touched[fieldName]) {
      return errors[fieldName] ? styles['has-error'] : styles.valid;
    }
    return '';
  };

  const isDemarcheur = user.type_compte === 'demarcheur';
  const showFonction = isDemarcheur && (form.statut === 'rattache' || form.statut === 'proprietaire');

  return (
    <form className={styles.box} onSubmit={submit} noValidate>
      {!editing ? (
        <div className={styles.editButtonContainer}>
          <button 
            type="button" 
            onClick={startEditing}
            className={styles.editButton}
          >
            Modifier le profil
          </button>
        </div>
      ) : (
        <>
          <h2 className={styles.boxTitle}>Modifier mon profil</h2>

          {/* NOM & PRÉNOM (pour non-agence) */}
          {user.type_compte !== 'agence' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Nom & Prénom
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  type="text"
                  name="nom_prenom"
                  value={form.nom_prenom}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.input} ${getInputClassName('nom_prenom')}`}
                  placeholder="Ex: Konan N'Guessan"
                  aria-invalid={!!errors.nom_prenom}
                  aria-describedby={errors.nom_prenom ? 'error-nom-prenom' : undefined}
                />
                {touched.nom_prenom && !errors.nom_prenom && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {touched.nom_prenom && errors.nom_prenom && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>
              {errors.nom_prenom && touched.nom_prenom && (
                <div id="error-nom-prenom" className={styles.errorMessage}>
                  {errors.nom_prenom}
                </div>
              )}
            </div>
          )}

          {/* NOM AGENCE (pour agence) */}
          {user.type_compte === 'agence' && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Nom de l'agence
              </label>
              <div className={styles.inputWrapper}>
                <input 
                  type="text"
                  name="nom_agence"
                  value={form.nom_agence}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.input} ${getInputClassName('nom_agence')}`}
                  placeholder="Ex: Agence Prestige"
                  aria-invalid={!!errors.nom_agence}
                  aria-describedby={errors.nom_agence ? 'error-nom-agence' : undefined}
                />
                {touched.nom_agence && !errors.nom_agence && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {touched.nom_agence && errors.nom_agence && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>
              {errors.nom_agence && touched.nom_agence && (
                <div id="error-nom-agence" className={styles.errorMessage}>
                  {errors.nom_agence}
                </div>
              )}
            </div>
          )}

          {/* NUMÉRO DE CONTACT */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Numéro de téléphone
            </label>
            <div className={styles.inputWrapper}>
              <input 
                type="tel"
                name="numero"
                value={form.numero}
                onChange={handleNumeroChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClassName('numero')}`}
                placeholder="+225 XX XX XX XX XX"
                aria-invalid={!!errors.numero}
                aria-describedby={errors.numero ? 'error-numero' : undefined}
              />
              {touched.numero && !errors.numero && (
                <FaCheckCircle className={styles.validIcon} />
              )}
              {touched.numero && errors.numero && (
                <FaExclamationCircle className={styles.errorIcon} />
              )}
            </div>
            {errors.numero && touched.numero && (
              <div id="error-numero" className={styles.errorMessage}>
                {errors.numero}
              </div>
            )}
          </div>

          {/* STATUT (démarcheur seulement) */}
          {isDemarcheur && (
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Statut
              </label>
              <div className={styles.inputWrapper}>
                <select
                  name="statut"
                  value={form.statut}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${styles.select} ${getInputClassName('statut')}`}
                  aria-invalid={!!errors.statut}
                  aria-describedby={errors.statut ? 'error-statut' : undefined}
                >
                  <option value="">Sélectionnez votre statut</option>
                  <option value="independant">Indépendant</option>
                  <option value="rattache">Rattaché</option>
                  <option value="proprietaire">Propriétaire</option>
                </select>
                {touched.statut && !errors.statut && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {touched.statut && errors.statut && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>
              {errors.statut && touched.statut && (
                <div id="error-statut" className={styles.errorMessage}>
                  {errors.statut}
                </div>
              )}
            </div>
          )}

          {/* FONCTION & NUMÉRO FONCTION (si rattaché/propriétaire) */}
          {showFonction && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Nom de l'agence / Entreprise
                </label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="text"
                      name="fonction"
                      value={form.fonction}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`${styles.input} ${getInputClassName('fonction')}`}
                      placeholder="Nom de l'organisation"
                      aria-invalid={!!errors.fonction}
                      aria-describedby={errors.fonction ? 'error-fonction' : undefined}
                    />
                    {touched.fonction && !errors.fonction && (
                      <FaCheckCircle className={styles.validIcon} />
                    )}
                    {touched.fonction && errors.fonction && (
                      <FaExclamationCircle className={styles.errorIcon} />
                    )}
                  </div>
                  {errors.fonction && touched.fonction && (
                    <div id="error-fonction" className={styles.errorMessage}>
                      {errors.fonction}
                    </div>
                  )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Numéro professionnel
                </label>
                <div className={styles.inputWrapper}>
                  <input 
                    type="tel"
                    name="numero_fonction"
                    value={form.numero_fonction}
                    onChange={handleNumeroChange}
                    onBlur={handleBlur}
                    className={`${styles.input} ${getInputClassName('numero_fonction')}`}
                    placeholder="+225 XX XX XX XX XX"
                    aria-invalid={!!errors.numero_fonction}
                    aria-describedby={errors.numero_fonction ? 'error-numero-fonction' : undefined}
                  />
                  {touched.numero_fonction && !errors.numero_fonction && (
                    <FaCheckCircle className={styles.validIcon} />
                  )}
                  {touched.numero_fonction && errors.numero_fonction && (
                    <FaExclamationCircle className={styles.errorIcon} />
                  )}
                </div>
                {errors.numero_fonction && touched.numero_fonction && (
                  <div id="error-numero-fonction" className={styles.errorMessage}>
                    {errors.numero_fonction}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ADRESSE */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Adresse
            </label>
            <div className={styles.inputWrapper}>
              <input 
                type="text"
                name="adresse"
                value={form.adresse}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClassName('adresse')}`}
                placeholder="Votre adresse complète"
                aria-invalid={!!errors.adresse}
                aria-describedby={errors.adresse ? 'error-adresse' : undefined}
              />
              {touched.adresse && !errors.adresse && (
                <FaCheckCircle className={styles.validIcon} />
              )}
              {touched.adresse && errors.adresse && (
                <FaExclamationCircle className={styles.errorIcon} />
              )}
            </div>
            {errors.adresse && touched.adresse && (
              <div id="error-adresse" className={styles.errorMessage}>
                {errors.adresse}
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Description
            </label>
            <div className={styles.inputWrapper}>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.textarea} ${getInputClassName('description')}`}
                placeholder="Décrivez-vous ou votre activité (20-500 caractères)"
                rows="4"
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? 'error-description' : undefined}
              />
              {touched.description && !errors.description && (
                <FaCheckCircle className={styles.validIcon} />
              )}
              {touched.description && errors.description && (
                <FaExclamationCircle className={styles.errorIcon} />
              )}
            </div>
            {errors.description && touched.description && (
              <div id="error-description" className={styles.errorMessage}>
                {errors.description}
              </div>
            )}
          </div>

          {/* PHOTO DE PROFIL */}
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Photo de profil
            </label>
            <div className={styles.photoContainer}>
              <div className={styles.photoPreview}>
                <img 
                  src={form.photoPreview || '/default-avatar.png'} 
                  alt="Aperçu photo profil" 
                  className={styles.photoImage}
                />
              </div>
              <div className={styles.photoControls}>
                <button 
                  type="button" 
                  onClick={() => photoRef.current.click()}
                  className={styles.photoButton}
                >
                  <FaCamera /> Modifier la photo
                </button>
                <input 
                  type="file" 
                  ref={photoRef} 
                  onChange={handlePhoto}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className={styles.fileInput}
                  aria-label="Changer la photo de profil"
                />
                <small className={styles.photoHint}>
                  Formats: JPG, PNG, WebP (max 2Mo)
                </small>
                {errors.photo && touched.photo && (
                  <div className={styles.errorMessage}>
                    {errors.photo}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* BOUTONS D'ACTION */}
          <div className={styles.actionsRow}>
            <button 
              type="button" 
              onClick={() => {
                setForm(initialForm);
                setErrors({});
                setTouched({});
                setEditing(false);
              }}
              className={styles.cancelButton}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={!isFormValid() || loading}
              className={styles.submitButton}
              aria-busy={loading}
            >
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}

/* ======================================================
   SÉCURITÉ - MOT DE PASSE (Version améliorée)
====================================================== */
function PasswordPanel({ global }) {
  const [form, setForm] = useState({ 
    ancien: '', 
    nouveau: '', 
    confirmation: '' 
  });
  const [show, setShow] = useState(false);
  const [showCriteria, setShowCriteria] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Critères de mot de passe comme Inscription.jsx
  const passwordCriteria = {
    length: form.nouveau.length >= 8,
    uppercase: /[A-Z]/.test(form.nouveau),
    lowercase: /[a-z]/.test(form.nouveau),
    number: /\d/.test(form.nouveau),
    special: /[!@#$%^&*]/.test(form.nouveau)
  };

  // Validations
  const validateField = (name, value) => {
    switch (name) {
      case 'ancien':
        if (!value) return 'L\'ancien mot de passe est obligatoire.';
        return null;
      case 'nouveau':
        if (!value) return 'Le nouveau mot de passe est obligatoire.';
        if (!passwordCriteria.length) return 'Minimum 8 caractères.';
        if (!passwordCriteria.uppercase) return 'Au moins une majuscule.';
        if (!passwordCriteria.lowercase) return 'Au moins une minuscule.';
        if (!passwordCriteria.number) return 'Au moins un chiffre.';
        if (!passwordCriteria.special) return 'Au moins un caractère spécial (!@#$%^&*).';
        return null;
      case 'confirmation':
        if (!value) return 'La confirmation est obligatoire.';
        if (value !== form.nouveau) return 'Les mots de passe ne correspondent pas.';
        return null;
      default:
        return null;
    }
  };

  // Vérifier si le formulaire est valide
  const isFormValid = () => {
    return !errors.ancien && !errors.nouveau && !errors.confirmation &&
           form.ancien && form.nouveau && form.confirmation &&
           Object.values(passwordCriteria).every(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, form[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const getInputClassName = (fieldName) => {
    if (touched[fieldName]) {
      return errors[fieldName] ? styles['has-error'] : styles.valid;
    }
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    
    // Marquer tous comme touchés
    setTouched({ ancien: true, nouveau: true, confirmation: true });
    
    // Valider
    const newErrors = {
      ancien: validateField('ancien', form.ancien),
      nouveau: validateField('nouveau', form.nouveau),
      confirmation: validateField('confirmation', form.confirmation)
    };
    setErrors(newErrors);
    
    if (newErrors.ancien || newErrors.nouveau || newErrors.confirmation) {
      global.setMessage({ type: 'error', text: 'Veuillez corriger les erreurs.' });
      return;
    }

    setLoading(true);
    
    try {
      // Send as FormData (multipart/form-data) like profile update so PHP reads $_POST
      const data = new FormData();
      data.append('ancien', form.ancien || '');
      data.append('nouveau', form.nouveau || '');
      data.append('confirmation', form.confirmation || '');

      const res = await axios.post(
        'http://localhost/plateforme_immobiliere/public/api_dashboard_users/modifier_profil_mdp.php',
        data,
        {
          withCredentials: true,
          timeout: 10000,
          // Let axios set the Content-Type boundary for multipart
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (res.data?.success) {
        global.setMessage({ type: 'success', text: res.data.message });
        setForm({ ancien: '', nouveau: '', confirmation: '' });
        setTouched({});
        setErrors({});
        setShowCriteria(false);
      } else {
        if (res.data?.errors) {
          setErrors(res.data.errors);
          const t = {};
          Object.keys(res.data.errors).forEach(k => { t[k] = true; });
          setTouched(prev => ({ ...prev, ...t }));
          global.setMessage({ type: 'error', text: 'Veuillez corriger les erreurs.' });
        } else {
          global.setMessage({ type: 'error', text: res.data?.erreur || 'Erreur lors de la modification.' });
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
        // If backend returned validation errors in error response
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
          const t = {};
          Object.keys(error.response.data.errors).forEach(k => { t[k] = true; });
          setTouched(prev => ({ ...prev, ...t }));
          global.setMessage({ type: 'error', text: 'Veuillez corriger les erreurs.' });
        } else {
          global.setMessage({ type: 'error', text: 'Erreur serveur. Réessayez plus tard.' });
        }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={styles.box} onSubmit={submit} noValidate>
      <h2 className={styles.boxTitle}>Changer le mot de passe</h2>

      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Ancien mot de passe
        </label>
        <input 
          type="password" 
          name="ancien"
          value={form.ancien}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.input} ${getInputClassName('ancien')}`}
          placeholder="Saisissez votre ancien mot de passe"
          aria-invalid={!!errors.ancien}
          aria-describedby={errors.ancien ? 'error-ancien' : undefined}
        />
        {errors.ancien && touched.ancien && (
          <div id="error-ancien" className={styles.errorMessage}>
            {errors.ancien}
          </div>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Nouveau mot de passe
        </label>
        <div className={styles.passwordWrap}>
          <input
            type={show ? 'text' : 'password'}
            name="nouveau"
            value={form.nouveau}
            onChange={handleChange}
            onFocus={() => setShowCriteria(true)}
            onBlur={(e) => {
              handleBlur(e);
              if (!form.nouveau) setShowCriteria(false);
            }}
            className={`${styles.input} ${getInputClassName('nouveau')}`}
            placeholder="Saisissez votre nouveau mot de passe"
            aria-invalid={!!errors.nouveau}
            aria-describedby={errors.nouveau ? 'error-nouveau' : undefined}
          />
          <button 
            type="button"
            className={styles.passwordToggle}
            onClick={() => setShow(!show)}
            aria-label={show ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
          >
            {show ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        
        {/* Critères de mot de passe */}
        <ul className={`${styles.passwordCriteria} ${showCriteria ? styles.active : ''}`}>
          <li className={passwordCriteria.length ? styles.valid : ''}>
            Au moins 8 caractères
          </li>
          <li className={passwordCriteria.uppercase ? styles.valid : ''}>
            Une majuscule
          </li>
          <li className={passwordCriteria.lowercase ? styles.valid : ''}>
            Une minuscule
          </li>
          <li className={passwordCriteria.number ? styles.valid : ''}>
            Un chiffre
          </li>
          <li className={passwordCriteria.special ? styles.valid : ''}>
            Un caractère spécial (!@#$%^&*)
          </li>
        </ul>
        
        {errors.nouveau && touched.nouveau && (
          <div id="error-nouveau" className={styles.errorMessage}>
            {errors.nouveau}
          </div>
        )}
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Confirmation
        </label>
        <input 
          type="password" 
          name="confirmation"
          value={form.confirmation}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${styles.input} ${getInputClassName('confirmation')}`}
          placeholder="Confirmez votre nouveau mot de passe"
          aria-invalid={!!errors.confirmation}
          aria-describedby={errors.confirmation ? 'error-confirmation' : undefined}
        />
        {errors.confirmation && touched.confirmation ? (
          <div id="error-confirmation" className={styles.errorMessage}>
            {errors.confirmation}
          </div>
        ) : form.confirmation && form.nouveau === form.confirmation ? (
          <div className={styles.passwordMatch}>
            ✓ Les mots de passe correspondent
          </div>
        ) : null}
      </div>

      <button 
        type="submit" 
        disabled={!isFormValid() || loading}
        className={styles.submitButton}
        aria-busy={loading}
      >
        {loading ? 'Modification en cours...' : 'Modifier le mot de passe'}
      </button>
    </form>
  );
}

/* ======================================================
   SUPPRESSION DU COMPTE (Version améliorée)
====================================================== */
function DeleteAccountPanel({ global }) {
  const [motif, setMotif] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const error = !motif.trim() ? 'Motif obligatoire' 
    : motif.trim().length < 10 ? 'Minimum 10 caractères'
    : motif.trim().length > 500 ? 'Maximum 500 caractères'
    : null;

  const confirm = async () => {
    if (error || loading) return;
    
    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost/plateforme_immobiliere/public/api_dashboard_users/supprimer_compte.php',
        { motif: motif.trim() },
        { 
          withCredentials: true,
          timeout: 10000
        }
      );

      if (res.data?.success) {
        global.setMessage({ type: 'success', text: res.data.message });
        // Redirection pourrait être gérée ici si nécessaire
      } else {
        global.setMessage({ type: 'error', text: res.data?.erreur || 'Erreur lors de la suppression.' });
        setShowModal(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      global.setMessage({ type: 'error', text: 'Erreur serveur. Réessayez plus tard.' });
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.box}>
      <h2 className={styles.boxTitle}>Supprimer mon compte</h2>
      
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>
          Motif de suppression (10-500 caractères)
        </label>
        <textarea
          value={motif}
          onChange={(e) => {
            setMotif(e.target.value);
            if (!touched) setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          className={`${styles.textarea} ${touched && error ? styles['has-error'] : ''}`}
          placeholder="Expliquez pourquoi vous souhaitez supprimer votre compte..."
          rows="4"
          aria-invalid={!!error}
          aria-describedby={error ? 'error-motif' : undefined}
        />
        {touched && error && (
          <div id="error-motif" className={styles.errorMessage}>
            {error}
          </div>
        )}
      </div>

      <button 
        className={`${styles.dangerButton} ${error ? styles.disabled : ''}`}
        disabled={!!error || loading}
        onClick={() => setShowModal(true)}
      >
        {loading ? 'Suppression...' : 'Supprimer définitivement'}
      </button>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirmer la suppression</h3>
            <p className={styles.modalText}>
              Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              Êtes-vous sûr de vouloir continuer ?
            </p>
            <div className={styles.modalActions}>
              <button 
                onClick={() => setShowModal(false)}
                className={styles.modalCancel}
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                onClick={confirm}
                className={styles.modalConfirm}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}