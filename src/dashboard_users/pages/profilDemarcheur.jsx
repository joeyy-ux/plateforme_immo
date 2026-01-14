// src/pages/ProfilDemarcheur.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  FaImage, FaIdCard, FaUser, FaTimes, FaMapMarkerAlt, FaAlignLeft, FaBriefcase, FaUserTie, FaPhone
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilDemarcheur.module.css";

const API_UPLOAD = "http://localhost/plateforme_immo/public/api_dashboard_users/demarcheur.php";
const IMAGE_FIELDS = ["photoLogo", "pieceRecto", "pieceVerso", "selfie"];
const ALLOWED = ["image/jpeg","image/jpg","image/png","image/gif"];
const MAX_SIZE = 2 * 1024 * 1024;

export default function ProfilDemarcheur() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    adresse: "",
    description: "",
    statut: "",
    fonction: "",
    numero_fonction: "",
    photoLogo: null,
    pieceRecto: null,
    pieceVerso: null,
    selfie: null
  });

  const [previews, setPreviews] = useState({
    photoLogo: null, pieceRecto: null, pieceVerso: null, selfie: null
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const fileRefs = useRef({});
  const submitAbortRef = useRef(null);

  // create/revoke previews when files change
  useEffect(() => {
    const created = {};
    const toRevoke = [];

    IMAGE_FIELDS.forEach(k => {
      const f = formData[k];
      if (f instanceof File) {
        const url = URL.createObjectURL(f);
        created[k] = url;
        toRevoke.push(url);
      } else {
        created[k] = null;
      }
    });

    setPreviews(created);

    return () => {
      toRevoke.forEach(u => { if (u) URL.revokeObjectURL(u); });
    };
  }, [formData.photoLogo, formData.pieceRecto, formData.pieceVerso, formData.selfie]);

  // abort on unmount
  useEffect(() => {
    return () => {
      if (submitAbortRef.current) {
        try { submitAbortRef.current.abort(); } catch (_) {}
        submitAbortRef.current = null;
      }
    };
  }, []);

  // validation per-field (numero_fonction uses same rules as Inscription)
  const validateField = (name, value) => {
    switch (name) {
      case "adresse": {
        const v = (value ?? "").toString().trim();
        if (!v) return "L'adresse est obligatoire.";
        if (v.length < 5) return "Trop courte (min 5).";
        if (v.length > 100) return "Trop longue (max 100).";
        return null;
      }
      case "description": {
        const v = (value ?? "").toString().trim();
        if (!v) return "Description obligatoire.";
        if (v.length < 20) return "Trop courte (min 20).";
        if (v.length > 500) return "Trop longue (max 500).";
        return null;
      }
      case "statut": {
        const valid = ["independant","rattache","proprietaire"];
        if (!valid.includes(value)) return "Sélection obligatoire.";
        return null;
      }
      case "fonction": {
        if (formData.statut === "rattache" || formData.statut === "proprietaire") {
          if (!value || !value.trim()) return "Nom obligatoire.";
        }
        return null;
      }
      case "numero_fonction": {
        // only required when statut is 'rattache' or 'proprietaire'
        if (formData.statut === "rattache" || formData.statut === "proprietaire") {
          const v = (value ?? "").toString();
          if (!v) return "Le numéro est obligatoire.";
          // same regex as in Inscription.jsx: /^\+225( \d{2}){0,5}$/
          const ok = /^\+225( \d{2}){0,5}$/.test(v) || v === '+225 ';
          if (!ok) return "Format : +225 XX XX XX XX XX";
        }
        return null;
      }
      case "photoLogo":
      case "pieceRecto":
      case "pieceVerso":
      case "selfie": {
        const f = value;
        if (!(f instanceof File)) return "Fichier obligatoire.";
        if (!ALLOWED.includes(f.type)) return "Format non autorisé (jpg/png/gif).";
        if (f.size > MAX_SIZE) return "Le fichier ne peut pas dépasser 2 Mo.";
        return null;
      }
      default:
        return null;
    }
  };

  // full form validity
  const checkFormValidity = () => {
    // required text fields
    const textFields = ["adresse","description","statut"];
    for (const k of textFields) {
      if (validateField(k, formData[k])) return false;
    }
    // conditional fields fonction/numero
    if (formData.statut === "rattache" || formData.statut === "proprietaire") {
      if (validateField("fonction", formData.fonction)) return false;
      if (validateField("numero_fonction", formData.numero_fonction)) return false;
    }
    // images
    for (const k of IMAGE_FIELDS) {
      if (validateField(k, formData[k])) return false;
    }
    return true;
  };

  // sync canSubmit
  useEffect(() => {
    setCanSubmit(checkFormValidity());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, errors]);

  // handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  // number formatting like Inscription.jsx
  const handleNumeroChange = (e) => {
    // keep only digits and plus
    let input = e.target.value.replace(/[^\d+]/g, '');

    // strip leading country code if present
    if (input.startsWith('+225')) input = input.substring(4);
    else if (input.startsWith('225')) input = input.substring(3);

    // limit to 10 digits
    input = input.substring(0, 10);

    let formatted = '+225 ';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += input[i];
    }

    // keep trailing space trimmed as in inscription (they used trimEnd)
    formatted = formatted.trimEnd();

    setFormData(prev => ({ ...prev, numero_fonction: formatted }));
    setErrors(prev => ({ ...prev, numero_fonction: null }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;
    const file = files[0];

    if (!ALLOWED.includes(file.type)) {
      setErrors(prev => ({ ...prev, [name]: "Format non autorisé (jpg/png/gif)." }));
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }
    if (file.size > MAX_SIZE) {
      setErrors(prev => ({ ...prev, [name]: "Le fichier ne peut pas dépasser 2 Mo." }));
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: file }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, file);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleBlur = (e) => {
    const name = e.target.name;
    setTouched(prev => ({ ...prev, [name]: true }));
    const val = formData[name];
    const err = validateField(name, val);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const removeFile = (key) => {
    setFormData(prev => ({ ...prev, [key]: null }));
    setErrors(prev => ({ ...prev, [key]: null }));
    setTouched(prev => ({ ...prev, [key]: false }));
    const ref = fileRefs.current[key];
    if (ref && typeof ref.value !== 'undefined') ref.value = "";
  };

  const focusFirstInvalid = (errs) => {
    const ordered = ['adresse','description','pieceRecto','pieceVerso','selfie','photoLogo','statut','fonction','numero_fonction'];
    for (const k of ordered) {
      if (errs[k]) {
        const el = document.querySelector(`[name="${k}"]`) || document.getElementById(k);
        if (el && typeof el.focus === 'function') { el.focus(); break; }
      }
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // mark touched
    const t = {
      adresse:true, description:true, statut:true, fonction:true, numero_fonction:true,
      photoLogo:true, pieceRecto:true, pieceVerso:true, selfie:true
    };
    setTouched(t);

    const newErrors = {};
    // check fields
    ["adresse","description","statut","fonction","numero_fonction", ...IMAGE_FIELDS].forEach(k => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstInvalid(newErrors);
      return;
    }

    if (!checkFormValidity()) return;

    // abort previous
    if (submitAbortRef.current) {
      try { submitAbortRef.current.abort(); } catch (_) {}
    }
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);

    const payload = new FormData();
    payload.append('adresse', formData.adresse.trim());
    payload.append('description', formData.description.trim());
    payload.append('statut', formData.statut);
    if (formData.fonction) payload.append('fonction', formData.fonction.trim());
    if (formData.numero_fonction) payload.append('numero_fonction', formData.numero_fonction.trim());
    IMAGE_FIELDS.forEach(k => {
      if (formData[k] instanceof File) payload.append(k, formData[k]);
    });

    try {
      const res = await axios.post(API_UPLOAD, payload, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 20000,
        signal: controller.signal
      });

      const data = res?.data ?? {};
      if (data.success) {
        window.sessionStorage.setItem("completerProfil_success", data.message || "Profil complété avec succès !");
        window.dispatchEvent(new Event('profile-completed'));
        // reset
        setFormData({
          adresse: "",
          description: "",
          statut: "",
          fonction: "",
          numero_fonction: "",
          photoLogo: null,
          pieceRecto: null,
          pieceVerso: null,
          selfie: null
        });
        Object.keys(fileRefs.current).forEach(k => {
          const el = fileRefs.current[k];
          if (el && typeof el.value !== "undefined") el.value = "";
        });
        setErrors({});
        setTouched({});
        setCanSubmit(false);
        // navigate
        setTimeout(() => navigate("/dashboard/accueil"), 200);
        return;
      }

      const srv = data.errors || {};
      if (data.message && Object.keys(srv).length === 0) srv.global = data.message;
      setErrors(srv);
      if (Object.keys(srv).length > 0) focusFirstInvalid(srv);

    } catch (err) {
      if (axios.isCancel(err)) return;
      console.error("Upload error:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/inscription", { replace: true });
        return;
      }
      setErrors({ global: "Erreur serveur ou réseau. Réessaie plus tard." });
    } finally {
      setIsSubmitting(false);
      if (submitAbortRef.current === controller) submitAbortRef.current = null;
    }
  };

  const renderError = (key) => {
    if (!touched[key] && !errors[key]) return null;
    return errors[key] ? <div id={`err-${key}`} className={styles.errorMsg}>{errors[key]}</div> : null;
  };

  const fileInputsOrder = [
    { key: "pieceRecto", label: "CNI Recto", icon: <FaIdCard /> },
    { key: "pieceVerso", label: "CNI Verso", icon: <FaIdCard /> },
    { key: "selfie", label: "Selfie vérification", icon: <FaUser /> },
    { key: "photoLogo", label: "Photo / Logo", icon: <FaImage /> }
  ];

  return (
    <div className={styles.containerProprio}>
      <main className={styles.ProfilProprio} aria-live="polite">
        <div className={styles.header}>
          <h2>Compléter votre profil démarch​eur</h2>
        </div>

        {errors.global && <div className={styles.errorMsgGlobal} role="alert">{errors.global}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className={styles.form} noValidate>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="adresse"><FaMapMarkerAlt /> Adresse personnelle</label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              value={formData.adresse}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.adresse ? `err-adresse` : undefined}
              className={[styles.textInput, touched.adresse && errors.adresse ? styles['has-error'] : '', touched.adresse && !errors.adresse ? styles['valid-field'] : ''].join(' ')}
              aria-invalid={!!errors.adresse}
            />
            {renderError('adresse')}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="description"><FaAlignLeft /> Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.description ? `err-description` : undefined}
              className={[styles.textArea, touched.description && errors.description ? styles['has-error'] : '', touched.description && !errors.description ? styles['valid-field'] : ''].join(' ')}
              aria-invalid={!!errors.description}
            />
            {renderError('description')}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="statut"><FaBriefcase /> Statut</label>
            <select
              id="statut"
              name="statut"
              value={formData.statut}
              onChange={handleChange}
              onBlur={handleBlur}
              className={[styles.textInput, touched.statut && errors.statut ? styles['has-error'] : '', touched.statut && !errors.statut ? styles['valid-field'] : ''].join(' ')}
              aria-invalid={!!errors.statut}
            >
              <option value="">Sélectionnez</option>
              <option value="independant">Indépendant</option>
              <option value="rattache">Rattaché</option>
              <option value="proprietaire">Propriétaire</option>
            </select>
            {renderError('statut')}
          </div>

          {(formData.statut === "rattache" || formData.statut === "proprietaire") && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="fonction"><FaUserTie /> Nom / Agence</label>
                <input
                  id="fonction"
                  name="fonction"
                  type="text"
                  value={formData.fonction}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={[styles.textInput, touched.fonction && errors.fonction ? styles['has-error'] : '', touched.fonction && !errors.fonction ? styles['valid-field'] : ''].join(' ')}
                  aria-invalid={!!errors.fonction}
                />
                {renderError('fonction')}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel} htmlFor="numero_fonction"><FaPhone /> Contact (10 chiffres)</label>
                <input
                  id="numero_fonction"
                  name="numero_fonction"
                  type="tel"
                  value={formData.numero_fonction}
                  onChange={handleNumeroChange}
                  onBlur={handleBlur}
                  placeholder="+225 XX XX XX XX XX"
                  className={[styles.textInput, touched.numero_fonction && errors.numero_fonction ? styles['has-error'] : '', touched.numero_fonction && !errors.numero_fonction ? styles['valid-field'] : ''].join(' ')}
                  aria-invalid={!!errors.numero_fonction}
                />
                {renderError('numero_fonction')}
              </div>
            </>
          )}

          <fieldset className={styles.fileFieldset}>
            <legend className={styles.legend}>Documents & images (jpg/png/gif, max 2Mo)</legend>

            {fileInputsOrder.map(({ key, label, icon }) => (
              <div key={key} className={styles.inputGroupFile}>
                <label className={styles.inputLabelFile} htmlFor={`file-${key}`}>{icon} <span>{label}</span></label>

                <div className={styles.previewRow}>
                  <div className={styles.previewBox}>
                    {previews[key] ? (
                      <div className={styles.previewWrap}>
                        <img
                          src={previews[key]}
                          alt={`${label} preview`}
                          className={`${styles.previewImg} ${key === 'photoLogo' ? styles.previewRound : ''}`}
                        />
                        <button type="button" className={styles.removeFileBtn} aria-label={`Supprimer ${label}`} onClick={() => removeFile(key)}>
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className={styles.placeholder}>Aucune image</div>
                    )}
                  </div>

                  <div className={styles.fileControls}>
                    <input
                      id={`file-${key}`}
                      ref={el => (fileRefs.current[key] = el)}
                      type="file"
                      name={key}
                      accept="image/jpeg,image/png,image/gif,image/jpg"
                      onChange={handleFileChange}
                      onBlur={handleBlur}
                      aria-describedby={errors[key] ? `err-${key}` : undefined}
                      className={[styles.fileInput, touched[key] && errors[key] ? styles['has-error'] : '', touched[key] && !errors[key] ? styles['valid-field'] : ''].join(' ')}
                      aria-label={`Charger ${label}`}
                    />
                    <small className={styles.hint}>jpg / png / gif — max 2 Mo</small>
                    {renderError(key)}
                  </div>
                </div>
              </div>
            ))}
          </fieldset>

          <div className={styles.actionsRow}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)} disabled={isSubmitting}>Annuler</button>
            <button type="submit" disabled={!canSubmit || isSubmitting} className={styles.submitBtn} aria-busy={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
