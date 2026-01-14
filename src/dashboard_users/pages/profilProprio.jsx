// src/pages/ProfilProprio.jsx
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaImage, FaIdCard, FaUser, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilProprio.module.css";

const API_UPLOAD = "http://localhost/plateforme_immo/public/api_dashboard_users/proprio.php";

export default function ProfilProprio() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    adresse: "",
    description: "",
    photoLogo: null,
    pieceRecto: null,
    pieceVerso: null,
    selfie: null
  });

  const [previews, setPreviews] = useState({
    photoLogo: null,
    pieceRecto: null,
    pieceVerso: null,
    selfie: null
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const fileRefs = useRef({});
  const submitAbortRef = useRef(null);

  // create/revoke previews
  useEffect(() => {
    const created = {};
    const toRevoke = [];

    ["pieceRecto","pieceVerso","selfie","photoLogo"].forEach((k) => {
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
      // revoke only the URLs created in this effect run
      toRevoke.forEach(u => { if (u) URL.revokeObjectURL(u); });
    };
  }, [formData]);

  // ensure any pending submit is aborted on unmount
  useEffect(() => {
    return () => {
      if (submitAbortRef.current) {
        try { submitAbortRef.current.abort(); } catch (_) {}
        submitAbortRef.current = null;
      }
    };
  }, []);

  // validation rules (field-level)
  const validateField = (name, value) => {
    switch (name) {
      case 'adresse':
        if (!value || !value.trim()) return "L'adresse est obligatoire.";
        if (value.trim().length < 5) return "Trop courte (min 5).";
        if (value.trim().length > 100) return "Trop longue (max 100).";
        return null;

      case 'description':
        if (!value || !value.trim()) return "Description obligatoire.";
        if (value.trim().length < 20) return "Trop courte (min 20).";
        if (value.trim().length > 500) return "Trop longue (max 500).";
        return null;

      case 'photoLogo':
      case 'pieceRecto':
      case 'pieceVerso':
      case 'selfie': {
        const f = value;
        if (!(f instanceof File)) return "Fichier obligatoire.";
        const allowed = ["image/jpeg","image/jpg","image/png","image/gif"];
        if (!allowed.includes(f.type)) return "Format non autorisé (jpg/png/gif).";
        if (f.size > 2 * 1024 * 1024) return "Le fichier ne peut pas dépasser 2 Mo.";
        return null;
      }

      default:
        return null;
    }
  };

  // global form validity
  const checkFormValidity = () => {
    const fields = ['adresse','description','photoLogo','pieceRecto','pieceVerso','selfie'];
    for (const f of fields) {
      const err = validateField(f, formData[f]);
      if (err) return false;
    }
    return true;
  };

  // keep canSubmit in sync
  useEffect(() => {
    setCanSubmit(checkFormValidity());
  }, [formData, errors]);

  // handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;
    const file = files[0];

    const allowed = ["image/jpeg","image/jpg","image/png","image/gif"];
    if (!allowed.includes(file.type)) {
      setErrors(prev => ({ ...prev, [name]: "Format non autorisé (jpg/png/gif)." }));
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
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
    const err = validateField(name, formData[name]);
    setErrors(prev => ({ ...prev, [name]: err }));
  };

  const removeFile = (key) => {
    setFormData(prev => ({ ...prev, [key]: null }));
    setErrors(prev => ({ ...prev, [key]: null }));
    setTouched(prev => ({ ...prev, [key]: false }));
    const ref = fileRefs.current[key];
    if (ref && typeof ref.value !== 'undefined') ref.value = "";
  };

  // focus first invalid field helper
  const focusFirstInvalid = (errs) => {
    const ordered = ['adresse','description','pieceRecto','pieceVerso','selfie','photoLogo'];
    for (const k of ordered) {
      if (errs[k]) {
        const el = document.querySelector(`[name="${k}"]`);
        if (el && typeof el.focus === 'function') { el.focus(); break; }
      }
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const t = { adresse:true, description:true, photoLogo:true, pieceRecto:true, pieceVerso:true, selfie:true };
    setTouched(t);

    const newErrors = {};
    ['adresse','description','photoLogo','pieceRecto','pieceVerso','selfie'].forEach(k => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      focusFirstInvalid(newErrors);
      return;
    }

    if (!checkFormValidity()) return; // safety

    // abort previous if any
    if (submitAbortRef.current) {
      try { submitAbortRef.current.abort(); } catch (_) {}
    }
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);

    const payload = new FormData();
    payload.append('adresse', formData.adresse.trim());
    payload.append('description', formData.description.trim());
    ['photoLogo','pieceRecto','pieceVerso','selfie'].forEach(k => {
      if (formData[k] instanceof File) payload.append(k, formData[k]);
    });

    try {
      const res = await axios.post(API_UPLOAD, payload, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 12000,
        signal: controller.signal
      });

      const data = res?.data ?? {};

      if (data.success) {
        // set message for accueil and dispatch event
        window.sessionStorage.setItem("completerProfil_success", data.message || "Profil complété avec succès !");
        window.dispatchEvent(new Event('profile-completed'));

        // clear form and file inputs
        setFormData({
          adresse: "",
          description: "",
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

        // navigate (kept your small delay for UX)
        setTimeout(() => navigate("/dashboard/accueil"), 200);
        return;
      }

      const srv = data.errors || {};
      if (data.message && Object.keys(srv).length === 0) srv.global = data.message;
      setErrors(srv);
      if (Object.keys(srv).length > 0) focusFirstInvalid(srv);
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("submit cancelled");
        return;
      }
      console.error("Upload error:", err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/inscription", { replace: true });
        return;
      }
      setErrors({ global: "Erreur serveur ou réseau. Réessaie plus tard." });
    } finally {
      setIsSubmitting(false);
      // clear ref
      if (submitAbortRef.current === controller) submitAbortRef.current = null;
    }
  };

  // helper to render small error text next to field (with aria support)
  const renderError = (key) => {
    if (!touched[key] && !errors[key]) return null;
    return errors[key] ? <div id={`err-${key}`} className={styles.errorMsg}>{errors[key]}</div> : null;
  };

  // order inputs so that Logo (photoLogo) is rendered last
  const fileInputsOrder = [
    { key: "pieceRecto", label: "CNI Recto", icon: <FaIdCard /> },
    { key: "pieceVerso", label: "CNI Verso", icon: <FaIdCard /> },
    { key: "selfie", label: "Selfie vérification", icon: <FaUser /> },
    { key: "photoLogo", label: "Logo", icon: <FaImage /> } // logo last
  ];

  return (
    <div className={styles.containerProprio}>
      <main className={styles.ProfilProprio} aria-live="polite">
        <div className={styles.header}>
          <h2>Compléter votre profil propriétaire</h2>
        </div>

        {errors.global && <div className={styles.errorMsgGlobal} role="alert">{errors.global}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data" className={styles.form} noValidate>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="adresse"><FaIdCard /> Adresse personnelle</label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              value={formData.adresse}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.adresse ? `err-adresse` : undefined}
              className={[
                styles.textInput,
                touched.adresse && errors.adresse ? styles['has-error'] : '',
                touched.adresse && !errors.adresse ? styles['valid-field'] : ''
              ].join(' ')}
              aria-invalid={!!errors.adresse}
            />
            {renderError('adresse')}
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel} htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.description ? `err-description` : undefined}
              className={[
                styles.textArea,
                touched.description && errors.description ? styles['has-error'] : '',
                touched.description && !errors.description ? styles['valid-field'] : ''
              ].join(' ')}
              aria-invalid={!!errors.description}
            />
            {renderError('description')}
          </div>

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
                      className={[
                        styles.fileInput,
                        touched[key] && errors[key] ? styles['has-error'] : '',
                        touched[key] && !errors[key] ? styles['valid-field'] : ''
                      ].join(' ')}
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
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)}>Annuler</button>
            <button type="submit" disabled={!canSubmit || isSubmitting} className={styles.submitBtn} aria-busy={isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
