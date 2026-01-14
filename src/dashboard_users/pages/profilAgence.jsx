// src/pages/ProfilAgence.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./profilAgence.module.css";
import {
  FaMapMarkerAlt,
  FaIdCard,
  FaFileContract,
  FaBriefcase,
  FaAlignLeft,
  FaImage,
  FaTimes
} from "react-icons/fa";

export default function ProfilAgence() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    adresse: "",
    nif: "",
    rccm: "",
    experience: "",
    description: "",
    logo: null
  });

  const [errors, setErrors] = useState({});
  const [previewUrl, setPreviewUrl] = useState("");
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef(null);
  const submitAbortRef = useRef(null);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      if (submitAbortRef.current) {
        try { submitAbortRef.current.abort(); } catch (_) {}
        submitAbortRef.current = null;
      }
    };
  }, []);

  // field-level validation
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "adresse": {
        const v = (value ?? "").toString().trim();
        if (!v) error = "Adresse obligatoire";
        else if (v.length < 5) error = "Trop courte (min 5)";
        else if (v.length > 100) error = "Trop longue (max 100)";
        else if (!/^[\p{L}0-9\s,.\-']+$/u.test(v)) error = "Caractères non autorisés";
        break;
      }
      case "nif": {
        const v = (value ?? "").toString().trim();
        if (v && !/^CI-\d{10}[A-Z0-9]{2}$/.test(v)) error = "Format NIF invalide (ex: CI-1234567890XX)";
        break;
      }
      case "rccm": {
        const v = (value ?? "").toString().trim();
        if (v && !/^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/.test(v)) error = "Format RCCM invalide";
        break;
      }
      case "experience": {
        const v = (value ?? "").toString().trim();
        if (v !== "") {
          const num = Number(v);
          if (!Number.isInteger(num) || num < 0 || num > 100) error = "Nombre entier entre 0 et 100 requis";
        }
        break;
      }
      case "description": {
        const v = (value ?? "").toString().trim();
        if (!v) error = "Description obligatoire";
        else if (v.length < 20) error = "Trop courte (min 20)";
        else if (v.length > 500) error = "Trop longue (max 500)";
        break;
      }
      case "logo": {
        const f = value;
        if (!(f instanceof File)) error = "Logo obligatoire";
        else {
          const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
          if (!allowed.includes(f.type)) error = "Format image non autorisé (jpg, png, gif)";
          else if (f.size > 2 * 1024 * 1024) error = "Taille max 2 Mo";
        }
        break;
      }
      default:
        break;
    }
    return error || null;
  };

  // build validation object from current form
  const buildValidation = () => {
    const keys = Object.keys(formData);
    const newErrors = {};
    keys.forEach((k) => {
      const err = validateField(k, formData[k]);
      if (err) newErrors[k] = err;
    });
    return newErrors;
  };

  // update canSubmit whenever form changes
  useEffect(() => {
    const newErrors = buildValidation();
    setCanSubmit(Object.keys(newErrors).length === 0);
  }, [formData]);

  // handle changes (text + file)
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));

    if (name === "logo") {
      const file = files && files[0] ? files[0] : null;

      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      if (file) {
        const err = validateField("logo", file);
        setErrors((prev) => {
          const copy = { ...prev };
          if (err) copy.logo = err; else delete copy.logo;
          return copy;
        });

        const url = URL.createObjectURL(file);
        previewObjectUrlRef.current = url;
        setPreviewUrl(url);
        setFormData((prev) => ({ ...prev, logo: file }));
      } else {
        setPreviewUrl("");
        setFormData((prev) => ({ ...prev, logo: null }));
        setErrors((prev) => ({ ...prev, logo: "Logo obligatoire" }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    const err = validateField(name, value);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[name] = err; else delete copy[name];
      return copy;
    });
  };

  const handleBlur = (e) => {
    const name = e.target.name;
    setTouched((t) => ({ ...t, [name]: true }));
    const err = validateField(name, formData[name]);
    setErrors((prev) => {
      const copy = { ...prev };
      if (err) copy[name] = err; else delete copy[name];
      return copy;
    });
  };

  const removeLogo = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    setPreviewUrl("");
    setFormData((prev) => ({ ...prev, logo: null }));
    setErrors((prev) => ({ ...prev, logo: "Logo obligatoire" }));
    setTouched((t) => ({ ...t, logo: false }));
  };

  const focusFirstInvalid = (errs) => {
    const order = ["adresse", "nif", "rccm", "experience", "description", "logo"];
    for (const k of order) {
      if (errs[k]) {
        const el = document.querySelector(`[name="${k}"]`) || document.getElementById(k);
        if (el && typeof el.focus === "function") { el.focus(); break; }
      }
    }
  };

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // mark all touched
    const allTouched = Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = buildValidation();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      focusFirstInvalid(newErrors);
      return;
    }

    // abort previous submit if any
    if (submitAbortRef.current) {
      try { submitAbortRef.current.abort(); } catch (_) {}
    }
    const controller = new AbortController();
    submitAbortRef.current = controller;

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      if (formData.adresse) payload.append("adresse", formData.adresse.trim());
      if (formData.nif) payload.append("nif", formData.nif.trim());
      if (formData.rccm) payload.append("rccm", formData.rccm.trim());
      if (formData.experience !== "") payload.append("experience", String(formData.experience));
      if (formData.description) payload.append("description", formData.description.trim());
      if (formData.logo instanceof File) payload.append("logo", formData.logo);

      const res = await axios.post(
        "http://localhost/plateforme_immo/public/api_dashboard_users/agence.php",
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 15000,
          signal: controller.signal
        }
      );

      const data = res?.data ?? {};
      if (data.success) {
        window.sessionStorage.setItem("completerProfil_success", data.message || "Profil agence complété avec succès !");
        if (previewObjectUrlRef.current) {
          URL.revokeObjectURL(previewObjectUrlRef.current);
          previewObjectUrlRef.current = null;
        }
        setPreviewUrl("");
        setErrors({});
        setTouched({});
        setFormData({
          adresse: "",
          nif: "",
          rccm: "",
          experience: "",
          description: "",
          logo: null
        });
        navigate("/dashboard/accueil");
        return;
      }

      const srv = data.errors || {};
      if (data.message && Object.keys(srv).length === 0) srv.global = data.message;
      setErrors((prev) => ({ ...prev, ...srv }));
      if (Object.keys(srv).length > 0) focusFirstInvalid(srv);

    } catch (err) {
      if (axios.isCancel(err)) return;
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigate("/inscription", { replace: true });
        return;
      }
      setErrors((prev) => ({ ...prev, global: "Erreur serveur, réessayez plus tard." }));
    } finally {
      setIsSubmitting(false);
      if (submitAbortRef.current === controller) submitAbortRef.current = null;
    }
  };

  const inputClassName = (field) => {
    const base = styles.input || "";
    if (touched[field]) {
      return errors[field] ? `${base} ${styles['has-error']}` : `${base} ${styles['valid-field']}`;
    }
    return base;
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.completerProfil} role="region" aria-labelledby="completerTitre">
        {errors.global && <div className={styles.globalError} role="alert">{errors.global}</div>}

        <h2 id="completerTitre" className={styles.title}>Compléter votre profil agence</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
          {["adresse", "nif", "rccm", "experience"].map((field) => (
            <div className={styles.inputGroup} key={field}>
              <label className={styles.label} htmlFor={field}>
                {field === "adresse" && <FaMapMarkerAlt />}
                {field === "nif" && <FaIdCard />}
                {field === "rccm" && <FaFileContract />}
                {field === "experience" && <FaBriefcase />}
                <span className={styles.labelText}> {field.charAt(0).toUpperCase() + field.slice(1)}</span>
              </label>

              <input
                id={field}
                name={field}
                type={field === "experience" ? "number" : "text"}
                value={formData[field]}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClassName(field)}
                aria-invalid={!!errors[field]}
                aria-describedby={errors[field] ? `${field}-error` : undefined}
                min={field === "experience" ? 0 : undefined}
                max={field === "experience" ? 100 : undefined}
              />

              {errors[field] && touched[field] && (
                <div id={`${field}-error`} className={styles.errorMessage}>{errors[field]}</div>
              )}
            </div>
          ))}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="description"><FaAlignLeft /> <span className={styles.labelText}>Description</span></label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`${styles.textarea} ${touched.description ? (errors.description ? styles['has-error'] : styles['valid-field']) : ""}`}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? "description-error" : undefined}
            />
            {errors.description && touched.description && (
              <div id="description-error" className={styles.errorMessage}>{errors.description}</div>
            )}
          </div>

          <div className={`${styles.inputGroup} ${styles.avatarContainer}`}>
            <label className={styles.label}><FaImage /> <span className={styles.labelText}>Logo / Avatar</span></label>

            <div className={styles.avatarPreview} aria-hidden={!previewUrl}>
              {previewUrl ? (
                <div className={styles.previewWrap}>
                  <img src={previewUrl} alt="Aperçu logo" className={`${styles.previewImg} ${styles.previewRound}`} />
                  <button
                    type="button"
                    aria-label="Supprimer logo"
                    title="Supprimer logo"
                    className={styles.removeBtn}
                    onClick={removeLogo}
                    disabled={isSubmitting}
                  >
                    <FaTimes />
                  </button>
                </div>
              ) : (
                <div className={styles.placeholder}>Aucun logo</div>
              )}
            </div>

            <input
              ref={fileInputRef}
              id="logo"
              type="file"
              name="logo"
              accept="image/jpeg,image/png,image/gif,image/jpg"
              onChange={handleChange}
              onBlur={handleBlur}
              className={styles.fileInput}
              aria-invalid={!!errors.logo}
              aria-describedby={errors.logo ? "logo-error" : undefined}
              disabled={isSubmitting}
            />

            {errors.logo && touched.logo && (
              <div id="logo-error" className={styles.errorMessage}>{errors.logo}</div>
            )}
          </div>

          <div className={styles.actionsRow}>
            <button type="button" className={styles.cancelBtn} onClick={() => navigate(-1)} disabled={isSubmitting}>Annuler</button>
            <button type="submit" className={`${styles.btn} ${(!canSubmit || isSubmitting) ? styles.btnDisabled : ""}`} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
