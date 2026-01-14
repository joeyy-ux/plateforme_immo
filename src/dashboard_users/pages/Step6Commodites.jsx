import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step6Commodites.module.css";
import {
  FaPlus,
  FaTrash,
  FaCouch,
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

const COMMODITES_DEFAULT = [
  "Climatisation",
  "Chauffage",
  "Cuisine équipée",
  "Internet",
  "Télévision",
];

const Step6Commodites = ({
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

  const commodites = {
    liste: formData.commodites?.liste || [],
    autres: formData.commodites?.autres || [],
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
  const updateCommodites = (data) => {
    setFormData((prev) => ({
      ...prev,
      commodites: {
        liste: prev.commodites?.liste || [],
        autres: prev.commodites?.autres || [],
        ...data,
      },
    }));
  };

  /* =========================
     AJOUT / SUPPRESSION AUTRES
  ========================= */
  const addAutre = () => {
    updateCommodites({
      autres: [...commodites.autres, ""],
    });
    setTouched((p) => [...p, false]);
  };

  const removeAutre = (index) => {
    updateCommodites({
      autres: commodites.autres.filter((_, i) => i !== index),
    });
    setTouched((p) => p.filter((_, i) => i !== index));
  };

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;
    setTouched(commodites.autres.map(() => true));
  }, [isRestoredFromStorage, commodites.autres.length]);

  // Marquer touched depuis erreurs backend (commodites_autres_{index})
  useEffect(() => {
    if (!backendErrors) return;
    const t = [...touched];
    Object.keys(backendErrors).forEach((k) => {
      if (k.startsWith("commodites_autres_")) {
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
    const hasError = commodites.autres.some(
      (item, index) => touched[index] && validateField(item)
    );

    setIsValid(!hasError);
  }, [commodites.autres, touched, validateField]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Commodités</h2>
      <p className={styles.stepDescription}>
        Sélectionnez les commodités disponibles pour ce bien (optionnel).
      </p>

      {/* CHECKBOX */}
      <div className={styles.checkboxGrid}>
        {COMMODITES_DEFAULT.map((item) => (
          <label key={item} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={commodites.liste.includes(item)}
              onChange={(e) => {
                const list = e.target.checked
                  ? [...commodites.liste, item]
                  : commodites.liste.filter((i) => i !== item);
                updateCommodites({ liste: list });
              }}
            />
            {item}
          </label>
        ))}
      </div>

      {/* AUTRES COMMODITÉS */}
      {commodites.autres.map((item, index) => {
        const isTouched = touched[index];
        const error = isTouched ? validateField(item) : null;

        return (
          <div key={index} className={styles.otherBlock}>
            <div className={styles.field}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  <FaCouch />
                </span>
                Autre commodité
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const list = [...commodites.autres];
                    list[index] = e.target.value;
                    updateCommodites({ autres: list });

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
                          delete copy[`commodites_autres_${index}`];
                          Object.keys(copy).forEach((k) => {
                            if (k.startsWith("commodites_liste")) delete copy[k];
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
        <FaPlus /> Ajouter autre commodité
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

export default Step6Commodites;
