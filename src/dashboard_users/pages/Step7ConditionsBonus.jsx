import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step7ConditionsBonus.module.css";
import {
  FaPlus,
  FaTrash,
  FaMoneyBillWave,
  FaGift,
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

const Step7ConditionsBonus = ({
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
  const [touched, setTouched] = useState({
    conditions_paiement: [],
    bonus: [],
  });
  const [isValid, setIsValid] = useState(true);

  /* =========================
     STRUCTURE SÉCURISÉE
  ========================= */
  const conditions = {
    conditions_paiement:
      formData.conditions_bonus?.conditions_paiement || [],
    bonus: formData.conditions_bonus?.bonus || [],
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
  const updateConditions = (data) => {
    setFormData((prev) => ({
      ...prev,
      conditions_bonus: {
        conditions_paiement:
          prev.conditions_bonus?.conditions_paiement || [],
        bonus: prev.conditions_bonus?.bonus || [],
        ...data,
      },
    }));
  };

  /* =========================
     AJOUT / SUPPRESSION
  ========================= */
  const addCondition = () => {
    updateConditions({
      conditions_paiement: [
        ...conditions.conditions_paiement,
        "",
      ],
    });
    setTouched((p) => ({
      ...p,
      conditions_paiement: [...p.conditions_paiement, false],
    }));
  };

  const removeCondition = (index) => {
    updateConditions({
      conditions_paiement:
        conditions.conditions_paiement.filter(
          (_, i) => i !== index
        ),
    });
    setTouched((p) => ({
      ...p,
      conditions_paiement: p.conditions_paiement.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const addBonus = () => {
    updateConditions({
      bonus: [...conditions.bonus, ""],
    });
    setTouched((p) => ({
      ...p,
      bonus: [...p.bonus, false],
    }));
  };

  const removeBonus = (index) => {
    updateConditions({
      bonus: conditions.bonus.filter((_, i) => i !== index),
    });
    setTouched((p) => ({
      ...p,
      bonus: p.bonus.filter((_, i) => i !== index),
    }));
  };

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;

    setTouched({
      conditions_paiement: conditions.conditions_paiement.map(
        () => true
      ),
      bonus: conditions.bonus.map(() => true),
    });
  }, [
    isRestoredFromStorage,
    conditions.conditions_paiement.length,
    conditions.bonus.length,
  ]);

  // Marquer touched depuis erreurs backend (conditions_paiement_{i}, bonus_{i})
  useEffect(() => {
    if (!backendErrors) return;
    const t = { ...touched };

    Object.keys(backendErrors).forEach((k) => {
      if (k.startsWith("conditions_paiement_")) {
        const idx = parseInt(k.split("_")[2], 10);
        if (!isNaN(idx)) {
          t.conditions_paiement = t.conditions_paiement || [];
          t.conditions_paiement[idx] = true;
        }
      }

      if (k.startsWith("bonus_")) {
        const idx = parseInt(k.split("_")[1], 10);
        if (!isNaN(idx)) {
          t.bonus = t.bonus || [];
          t.bonus[idx] = true;
        }
      }
    });

    setTouched((prev) => ({ ...prev, ...t }));
  }, [backendErrors]);

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    const hasError =
      conditions.conditions_paiement.some(
        (item, index) =>
          touched.conditions_paiement[index] &&
          validateField(item)
      ) ||
      conditions.bonus.some(
        (item, index) =>
          touched.bonus[index] && validateField(item)
      );

    setIsValid(!hasError);
  }, [
    conditions.conditions_paiement,
    conditions.bonus,
    touched,
    validateField,
  ]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>
        Conditions de paiement & Bonus
      </h2>
      <p className={styles.stepDescription}>
        Ajoutez les conditions de paiement et les bonus éventuels
        (optionnel).
      </p>

      {/* CONDITIONS DE PAIEMENT */}
      <h3 className={styles.sectionTitle}>
        Conditions de paiement
      </h3>

      {conditions.conditions_paiement.map((item, index) => {
        const isTouched = touched.conditions_paiement[index];
        const error = isTouched ? validateField(item) : null;

        return (
          <div key={index} className={styles.block}>
            <div className={styles.field}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  <FaMoneyBillWave />
                </span>
                Condition {index + 1}
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const list = [
                      ...conditions.conditions_paiement,
                    ];
                    list[index] = e.target.value;
                    updateConditions({
                      conditions_paiement: list,
                    });

                    setTouched((p) => {
                      const t = [...p.conditions_paiement];
                      t[index] = true;
                      return {
                        ...p,
                        conditions_paiement: t,
                      };
                    });

                    if (typeof setBackendErrors === "function") {
                      const err = validateField(e.target.value);
                      if (!err) {
                        setBackendErrors((prev) => {
                          const copy = { ...prev };
                          delete copy[`conditions_paiement_${index}`];
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
                  <FaExclamationCircle
                    className={styles.errorIcon}
                  />
                )}
              </div>

              {isTouched && error && (
                <p className={styles.errorText}>{error}</p>
              )}
            </div>

            <button
              className={styles.removeBtn}
              onClick={() => removeCondition(index)}
            >
              <FaTrash />
            </button>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addCondition}>
        <FaPlus /> Ajouter une condition de paiement
      </button>

      {/* BONUS */}
      <h3 className={styles.sectionTitle}>Bonus</h3>

      {conditions.bonus.map((item, index) => {
        const isTouched = touched.bonus[index];
        const error = isTouched ? validateField(item) : null;

        return (
          <div key={index} className={styles.block}>
            <div className={styles.field}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  <FaGift />
                </span>
                Bonus {index + 1}
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const list = [...conditions.bonus];
                    list[index] = e.target.value;
                    updateConditions({ bonus: list });

                    setTouched((p) => {
                      const t = [...p.bonus];
                      t[index] = true;
                      return { ...p, bonus: t };
                    });

                    if (typeof setBackendErrors === "function") {
                      const err = validateField(e.target.value);
                      if (!err) {
                        setBackendErrors((prev) => {
                          const copy = { ...prev };
                          delete copy[`bonus_${index}`];
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
                  <FaExclamationCircle
                    className={styles.errorIcon}
                  />
                )}
              </div>

              {isTouched && error && (
                <p className={styles.errorText}>{error}</p>
              )}
            </div>

            <button
              className={styles.removeBtn}
              onClick={() => removeBonus(index)}
            >
              <FaTrash />
            </button>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addBonus}>
        <FaPlus /> Ajouter un bonus
      </button>

      {/* ACTIONS */}
      <div className={styles.actions}>
        <button
          className={styles.btnSecondary}
          onClick={prevStep}
        >
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

export default Step7ConditionsBonus;
