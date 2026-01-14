import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step4Documents.module.css";
import {
  FaPlus,
  FaTrash,
  FaFileAlt,
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

const Step4Documents = ({
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

  const documents = Array.isArray(formData.documents)
    ? formData.documents
    : [];

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
  const updateDocuments = (list) => {
    setFormData((prev) => ({
      ...prev,
      documents: list,
    }));
  };

  /* =========================
     AJOUT / SUPPRESSION
  ========================= */
  const addDocument = () => {
    updateDocuments([...documents, ""]);
    setTouched((p) => [...p, false]);
  };

  const removeDocument = (index) => {
    updateDocuments(documents.filter((_, i) => i !== index));
    setTouched((p) => p.filter((_, i) => i !== index));
  };

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;
    setTouched(documents.map(() => true));
  }, [isRestoredFromStorage, documents.length]);

  // Marquer touched depuis erreurs backend (documents_{index})
  useEffect(() => {
    if (!backendErrors) return;
    const t = [...touched];
    Object.keys(backendErrors).forEach((k) => {
      if (k.startsWith("documents_")) {
        const idx = parseInt(k.split("_")[1], 10);
        if (!isNaN(idx)) t[idx] = true;
      }
    });

    if (t.some(Boolean)) setTouched((prev) => ({ ...t }));
  }, [backendErrors]);

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    const hasError = documents.some(
      (doc, index) => touched[index] && validateField(doc)
    );

    setIsValid(!hasError);
  }, [documents, touched, validateField]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Documents</h2>
      <p className={styles.stepDescription}>
        Ajoutez les documents disponibles pour ce bien (optionnel).
      </p>

      {documents.map((doc, index) => {
        const isTouched = touched[index];
        const error = isTouched ? validateField(doc) : null;

        return (
          <div key={index} className={styles.block}>
            <div className={styles.blockHeader}>
              <span>Document {index + 1}</span>
              <button onClick={() => removeDocument(index)}>
                <FaTrash />
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <span className={styles.labelIcon}>
                  <FaFileAlt />
                </span>
                Nom du document
                <span className={styles.required}>*</span>
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={doc}
                  onChange={(e) => {
                    const list = [...documents];
                    list[index] = e.target.value;
                    updateDocuments(list);

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
                            delete copy[`documents_${index}`];
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
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addDocument}>
        <FaPlus /> Ajouter un document
      </button>

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

export default Step4Documents;
