import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step5Accessibilite.module.css";
import {
  FaPlus,
  FaTrash,
  FaWheelchair,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

/* =========================
   VALIDATION
========================= */
const FORBIDDEN_CHARS_REGEX =
  /[~`•√π÷×§∆£¥$¢^°={}\\%©®™✓[\]><!?@#,€]/;

const MIN_LENGTH = 2;
const MAX_LENGTH = 150;

const ACCESSIBILITE_DEFAULT = [
  "Accès PMR",
  "Ascenseur",
  "Rampe d'accès",
];

const Step5Accessibilite = ({
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
  const [touched, setTouched] = useState([]);
  const [isValid, setIsValid] = useState(true);

  const accessibilite = {
    liste: formData.accessibilite?.liste || [],
    autres: formData.accessibilite?.autres || [],
  };

  /* =========================
     VALIDATION CHAMP
  ========================= */
  const validateField = useCallback((value) => {
    if (!value) return "Champ obligatoire";
    if (FORBIDDEN_CHARS_REGEX.test(value))
      return "Caractères non autorisés";
    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH)
      return `Entre ${MIN_LENGTH} et ${MAX_LENGTH} caractères`;
    return null;
  }, []);

  /* =========================
     UPDATE GLOBAL
  ========================= */
  const updateAccessibilite = (data) => {
    setFormData((prev) => ({
      ...prev,
      accessibilite: {
        liste: prev.accessibilite?.liste || [],
        autres: prev.accessibilite?.autres || [],
        ...data,
      },
    }));
  };

  /* =========================
     AJOUT / SUPPRESSION AUTRES
  ========================= */
  const addAutre = () => {
    updateAccessibilite({
      autres: [...accessibilite.autres, ""],
    });
    setTouched((p) => [...p, false]);
  };

  const removeAutre = (index) => {
    updateAccessibilite({
      autres: accessibilite.autres.filter((_, i) => i !== index),
    });
    setTouched((p) => p.filter((_, i) => i !== index));
  };

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;
    setTouched(accessibilite.autres.map(() => true));
  }, [isRestoredFromStorage, accessibilite.autres.length]);

  // Marquer touched depuis erreurs backend (accessibilite_autres_{index})
  useEffect(() => {
    if (!backendErrors) return;
    const t = [...touched];
    Object.keys(backendErrors).forEach((k) => {
      if (k.startsWith("accessibilite_autres_")) {
        const idx = parseInt(k.split("_")[2], 10);
        if (!isNaN(idx)) t[idx] = true;
      }
    });

    if (t.some(Boolean)) setTouched((prev) => ({ ...t }));
  }, [backendErrors]);

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    const hasError = accessibilite.autres.some(
      (item, index) => touched[index] && validateField(item)
    );

    setIsValid(!hasError);
  }, [accessibilite.autres, touched, validateField]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Accessibilité</h2>
      <p className={styles.stepDescription}>
        Sélectionnez les éléments d’accessibilité disponibles (optionnel).
      </p>

      {/* CHECKBOX */}
      <div className={styles.checkboxGrid}>
        {ACCESSIBILITE_DEFAULT.map((item) => (
          <label key={item} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={accessibilite.liste.includes(item)}
              onChange={(e) => {
                const list = e.target.checked
                  ? [...accessibilite.liste, item]
                  : accessibilite.liste.filter((i) => i !== item);
                updateAccessibilite({ liste: list });
              }}
            />
            {item}
          </label>
        ))}
      </div>

      {/* AUTRES ACCESSIBILITÉS */}
      {accessibilite.autres.map((item, index) => {
        const isTouched = touched[index];
        const error = isTouched ? validateField(item) : null;

        return (
          <div key={index} className={styles.otherBlock}>
            <div className={styles.field}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  <FaWheelchair />
                </span>
                Autre accessibilité
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const list = [...accessibilite.autres];
                    list[index] = e.target.value;
                    updateAccessibilite({ autres: list });

                      setTouched((p) => {
                        const t = [...p];
                        t[index] = true;
                        return t;
                      });

                    if (typeof setBackendErrors === "function") {
                      const err = validateField(e.target.value);
                      if (!err) {
                        setBackendErrors((prev) => {
                          const copy = { ...prev };
                          delete copy[`accessibilite_autres_${index}`];
                          // also remove any list errors if present
                          Object.keys(copy).forEach((k) => {
                            if (k.startsWith("accessibilite_liste")) delete copy[k];
                          });
                          return copy;
                        });
                      }
                    }
                  }}
                  className={`${styles.input} ${
                    isTouched && error
                      ? styles.error
                      : isTouched
                      ? styles.valid
                      : ""
                  }`}
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

            <button
              className={styles.removeBtn}
              onClick={() => removeAutre(index)}
            >
              <FaTrash />
            </button>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addAutre}>
        <FaPlus /> Ajouter autre accessibilité
      </button>

      {/* ACTIONS */}
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

export default Step5Accessibilite;
