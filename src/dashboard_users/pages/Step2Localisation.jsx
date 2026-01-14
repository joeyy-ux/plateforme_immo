import React, { useEffect, useRef, useState } from "react";
import styles from "./Step2Localisation.module.css";

/* =========================
   ICÔNES
========================= */
import {
  FaCity,
  FaMapMarkedAlt,
  FaMapPin,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

/* =========================
   CARACTÈRES INTERDITS
   (on autorise - et ')
========================= */
const FORBIDDEN_CHARS_REGEX =
  /[~`•√π÷×§∆£¥$¢^°={}\\%©®™✓[\]><!?@#,€]/;

/* =========================
   LIMITES
========================= */
const MIN_LENGTH = 2;
const MAX_LENGTH = 200;

const Step2Localisation = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  backendErrors = {},
  setBackendErrors,
  isRestoredFromStorage = false,
}) => {
  /* =========================
     STATES
  ========================= */
  const [touched, setTouched] = useState({});
  const [blurred, setBlurred] = useState({});
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const localisation = formData.localisation || {};

  /* =========================
     COMMUNE CACHE (UX)
  ========================= */
  const lastCommuneRef = useRef(null);

  /* =========================
     DÉTECTION ABIDJAN
  ========================= */
  const isAbidjan =
    localisation.ville &&
    localisation.ville.trim().toLowerCase() === "abidjan";

  /* =========================
     VALIDATION CHAMP
  ========================= */
  const validateField = (name, value) => {
    if (!value) return "Champ obligatoire";

    if (FORBIDDEN_CHARS_REGEX.test(value)) {
      return "Caractères non autorisés";
    }

    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
      return `Entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères`;
    }

    return null;
  };

  /* =========================
     BLUR (SORTIE DE CHAMP)
  ========================= */
  const handleBlur = (name) => {
    setBlurred((prev) => ({ ...prev, [name]: true }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validation immédiate sur blur
    const value = localisation[name] || "";
    const error = !value && isFieldRequired(name) ? "Champ obligatoire" : validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /* =========================
     FOCUS (ENTRÉE DANS CHAMP)
  ========================= */
  const handleFocus = (name) => {
    // Marquer comme touché quand on entre dans le champ
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  /* =========================
     VÉRIFICATION CHAMP OBLIGATOIRE
  ========================= */
  const isFieldRequired = (name) => {
    return ["ville", "commune", "quartier"].includes(name);
  };

  /* =========================
     HANDLE CHANGE
  ========================= */
  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      localisation: {
        ...prev.localisation,
        [name]: value,
      },
    }));

    setTouched((prev) => ({ ...prev, [name]: true }));

    if (typeof setBackendErrors === 'function') {
      setBackendErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }

    // Validation en temps réel sur changement
    const error = !value && isFieldRequired(name) ? "Champ obligatoire" : validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  /* =========================
     NETTOYAGE / RESTAURATION COMMUNE
  ========================= */
  useEffect(() => {
    if (!isAbidjan) {
      if (localisation.commune) {
        lastCommuneRef.current = localisation.commune;
      }

      setFormData((prev) => {
        const loc = { ...(prev.localisation || {}) };
        delete loc.commune;

        return {
          ...prev,
          localisation: loc,
        };
      });
    } else {
      if (!localisation.commune && lastCommuneRef.current) {
        setFormData((prev) => ({
          ...prev,
          localisation: {
            ...prev.localisation,
            commune: lastCommuneRef.current,
          },
        }));
      }
    }
  }, [isAbidjan, localisation.commune, setFormData]);

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;

    const newTouched = {};
    const newErrors = {};

    Object.keys(localisation || {}).forEach((field) => {
      newTouched[field] = true;
      const err = validateField(field, localisation[field]);
      if (err) newErrors[field] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);
  }, [isRestoredFromStorage, localisation]);

  // Marquer touched depuis erreurs backend pour afficher bordures/erreurs
  useEffect(() => {
    if (!backendErrors) return;
    const fields = ["ville", "commune", "quartier"];
    const t = {};
    Object.keys(backendErrors).forEach((k) => {
      if (fields.includes(k)) t[k] = true;
    });
    if (Object.keys(t).length > 0) setTouched((prev) => ({ ...prev, ...t }));
  }, [backendErrors]);

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    const required = ["ville", "quartier"];
    if (isAbidjan) required.push("commune");

    const newErrors = {};

    // Ne valider que les champs qui ont été touchés ou blurred
    Object.keys(touched).forEach((field) => {
      const value = localisation[field];
      const isRequired = required.includes(field);

      if (isRequired && !value) {
        newErrors[field] = "Champ obligatoire";
      } else if (value) {
        const err = validateField(field, value);
        if (err) newErrors[field] = err;
      }
    });

    // Valider aussi les champs blurred même s'ils n'ont pas été touchés
    Object.keys(blurred).forEach((field) => {
      if (!touched[field]) {
        const value = localisation[field];
        const isRequired = required.includes(field);

        if (isRequired && !value) {
          newErrors[field] = "Champ obligatoire";
        } else if (value) {
          const err = validateField(field, value);
          if (err) newErrors[field] = err;
        }
      }
    });

    // Ajouter les erreurs backend
    Object.entries(backendErrors || {}).forEach(([k, v]) => {
      newErrors[k] = v;
    });

    setErrors(newErrors);

    // Vérifier si tous les champs requis sont valides
    const allRequiredValid = required.every((field) => {
      const value = localisation[field];
      return value && !validateField(field, value);
    });

    setIsValid(allRequiredValid && Object.keys(newErrors).length === 0);
  }, [localisation, isAbidjan, backendErrors, touched, blurred]);

  /* =========================
     RENDER FIELD
  ========================= */
  const renderField = ({ label, icon, name }) => {
    const value = localisation[name] || "";
    const isTouched = touched[name];
    const error = errors[name];

    const stateClass =
      isTouched && error
        ? styles.error
        : isTouched && !error
        ? styles.valid
        : "";

    return (
      <div className={styles.field}>
        <label className={styles.label}>
          <span className={styles.labelIcon}>{icon}</span>
          {label}
          <span className={styles.required}>*</span>
        </label>

        <div className={styles.inputWrapper}>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            onBlur={() => handleBlur(name)}
            onFocus={() => handleFocus(name)}
            className={`${styles.input} ${stateClass}`}
          />

          {isTouched && !error && (
            <FaCheckCircle className={styles.validIcon} />
          )}
          {isTouched && error && (
            <FaExclamationCircle className={styles.errorIcon} />
          )}
        </div>

        {isTouched && error && (
          <p className={styles.errorText}>{error}</p>
        )}
      </div>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Localisation</h2>
      <p className={styles.stepDescription}>
        Indiquez précisément l’emplacement du bien.
      </p>

      <div className={styles.grid}>
        {renderField({
          label: "Ville",
          icon: <FaCity />,
          name: "ville",
        })}

        {isAbidjan &&
          renderField({
            label: "Commune",
            icon: <FaMapMarkedAlt />,
            name: "commune",
          })}

        {renderField({
          label: "Quartier",
          icon: <FaMapPin />,
          name: "quartier",
        })}
      </div>

      <div className={styles.actions}>
        <button className={styles.btnSecondary} onClick={prevStep}>
          Précédent
        </button>

        <button
          className={styles.btnPrimary}
          disabled={!isValid}
          onClick={nextStep}
        >
          Suivant
        </button>
      </div>
    </>
  );
};

export default Step2Localisation;
