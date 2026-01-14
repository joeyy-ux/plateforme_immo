import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step3Caracteristiques.module.css";
import {
  FaPlus,
  FaTrash,
  FaAlignLeft,
  FaInfoCircle,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

/* =========================
   VALIDATION
========================= */
const FORBIDDEN_CHARS_REGEX =
  /[~`•√π÷×§∆£¥$¢^°={}\\%©®™✓[\]><!?@#,€]/;

const EXTERIEUR_DEFAULT = [
  "Parking",
  "Balcon",
  "Terrasse",
  "Jardin",
  "Garage",
];

const MIN_LENGTH = 2;
const MAX_LENGTH = 150;

const Step3Caracteristiques = ({
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
    interieur: [],
    exterieur_autres: [],
  });
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(true);

  const caracteristiques = {
    interieur: formData.caracteristiques?.interieur || [],
    exterieur: formData.caracteristiques?.exterieur || [],
    exterieur_autres:
      formData.caracteristiques?.exterieur_autres || [],
  };

  /* =========================
     VALIDATION TEXTE
  ========================= */
  const validateText = useCallback((value) => {
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
  const updateCaracteristiques = (data) => {
    setFormData((prev) => ({
      ...prev,
      caracteristiques: {
        interieur: prev.caracteristiques?.interieur || [],
        exterieur: prev.caracteristiques?.exterieur || [],
        exterieur_autres:
          prev.caracteristiques?.exterieur_autres || [],
        ...data,
      },
    }));
  };

  /* =========================
     INTERIEUR
  ========================= */
  const addInterieur = () => {
    updateCaracteristiques({
      interieur: [
        ...caracteristiques.interieur,
        { titre: "", contenu: "" },
      ],
    });

    setTouched((p) => ({
      ...p,
      interieur: [
        ...p.interieur,
        { titre: false, contenu: false },
      ],
    }));
  };

  const removeInterieur = (index) => {
    updateCaracteristiques({
      interieur: caracteristiques.interieur.filter(
        (_, i) => i !== index
      ),
    });

    setTouched((p) => ({
      ...p,
      interieur: p.interieur.filter((_, i) => i !== index),
    }));
  };

  /* =========================
     EXTERIEUR AUTRES
  ========================= */
  const addExterieurAutre = () => {
    updateCaracteristiques({
      exterieur_autres: [
        ...caracteristiques.exterieur_autres,
        "",
      ],
    });

    setTouched((p) => ({
      ...p,
      exterieur_autres: [...p.exterieur_autres, false],
    }));
  };

  const removeExterieurAutre = (index) => {
    updateCaracteristiques({
      exterieur_autres:
        caracteristiques.exterieur_autres.filter(
          (_, i) => i !== index
        ),
    });

    setTouched((p) => ({
      ...p,
      exterieur_autres: p.exterieur_autres.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;

    setTouched({
      interieur: caracteristiques.interieur.map(() => ({
        titre: true,
        contenu: true,
      })),
      exterieur_autres:
        caracteristiques.exterieur_autres.map(() => true),
    });
  }, [
    isRestoredFromStorage,
    caracteristiques.interieur.length,
    caracteristiques.exterieur_autres.length,
  ]);

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    const newErrors = {};

    caracteristiques.interieur.forEach((item, index) => {
      const tErr = validateText(item.titre);
      const cErr = validateText(item.contenu);

      if (tErr || cErr) {
        newErrors[`interieur_${index}`] =
          backendErrors[`interieur_${index}`] || tErr || cErr;
      }
    });

    caracteristiques.exterieur_autres.forEach((item, index) => {
      const err =
        backendErrors[`exterieur_autres_${index}`] ||
        validateText(item);

      if (err) {
        newErrors[`exterieur_autres_${index}`] = err;
      }
    });

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
  }, [
    caracteristiques.interieur,
    caracteristiques.exterieur_autres,
    backendErrors,
    validateText,
  ]);

  // Marquer touched depuis erreurs backend pour afficher bordures/erreurs
  useEffect(() => {
    if (!backendErrors) return;
    const t = { ...touched };

    Object.keys(backendErrors).forEach((k) => {
      const m = k.match(/^interieur_(\d+)$/);
      if (m) {
        const idx = parseInt(m[1], 10);
        if (!t.interieur[idx]) t.interieur[idx] = { titre: true, contenu: true };
        else t.interieur[idx] = { ...t.interieur[idx], titre: true, contenu: true };
      }
      const m2 = k.match(/^exterieur_autres_(\d+)$/);
      if (m2) {
        const idx = parseInt(m2[1], 10);
        if (!t.exterieur_autres[idx]) t.exterieur_autres[idx] = true;
        else t.exterieur_autres[idx] = true;
      }
    });

    setTouched(t);
  }, [backendErrors]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Caractéristiques</h2>
      <p className={styles.stepDescription}>
        Ajoutez les caractéristiques intérieures et extérieures du bien.
      </p>

      {/* INTERIEUR */}
      <h3 className={styles.sectionTitle}>
        Caractéristiques intérieures
      </h3>

      {caracteristiques.interieur.map((item, index) => {
        const titreTouched = touched.interieur[index]?.titre;
        const contenuTouched = touched.interieur[index]?.contenu;

        const titreError = validateText(item.titre);
        const contenuError = validateText(item.contenu);

        return (
          <div key={index} className={styles.block}>
            <div className={styles.blockHeader}>
              <span>Caractéristique {index + 1}</span>
              <button onClick={() => removeInterieur(index)}>
                <FaTrash />
              </button>
            </div>

            {/* TITRE */}
            <div className={styles.field}>
              <label className={styles.label}>
                <FaAlignLeft /> Titre *
              </label>

              <div className={styles.inputWrapper}>
                <input
                  value={item.titre}
                  onChange={(e) => {
                    const list = [...caracteristiques.interieur];
                    list[index] = {
                      ...list[index],
                      titre: e.target.value,
                    };
                    updateCaracteristiques({ interieur: list });

                    setTouched((p) => {
                      const t = [...p.interieur];
                      t[index] = { ...t[index], titre: true };
                      return { ...p, interieur: t };
                    });
                      if (typeof setBackendErrors === 'function') {
                        const newTitre = e.target.value;
                        const otherContenu = caracteristiques.interieur[index]?.contenu || "";
                        const titreErr = validateText(newTitre);
                        const contenuErr = validateText(otherContenu);
                        if (!titreErr && !contenidoErr) {
                          setBackendErrors((prev) => {
                            const copy = { ...prev };
                            delete copy[`interieur_${index}`];
                            return copy;
                          });
                        }
                      }
                  }}
                  className={`${styles.input} ${
                    titreTouched && titreError
                      ? styles.error
                      : titreTouched
                      ? styles.valid
                      : ""
                  }`}
                />

                {titreTouched && !titreError && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {titreTouched && titreError && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>

              {titreTouched && titreError && (
                <p className={styles.errorText}>{titreError}</p>
              )}
            </div>

            {/* CONTENU */}
            <div className={styles.field}>
              <label className={styles.label}>
                <FaInfoCircle /> Contenu *
              </label>

              <div className={styles.inputWrapper}>
                <textarea
                  rows="4"
                  value={item.contenu}
                  onChange={(e) => {
                    const list = [...caracteristiques.interieur];
                    list[index] = {
                      ...list[index],
                      contenu: e.target.value,
                    };
                    updateCaracteristiques({ interieur: list });

                    setTouched((p) => {
                      const t = [...p.interieur];
                      t[index] = { ...t[index], contenu: true };
                      return { ...p, interieur: t };
                    });
                    if (typeof setBackendErrors === 'function') {
                      const newContenu = e.target.value;
                      const otherTitre = caracteristiques.interieur[index]?.titre || "";
                      const titreErr = validateText(otherTitre);
                      const contenuErr = validateText(newContenu);
                      if (!titreErr && !contenidoErr) {
                        setBackendErrors((prev) => {
                          const copy = { ...prev };
                          delete copy[`interieur_${index}`];
                          return copy;
                        });
                      }
                    }
                  }}
                  className={`${styles.input} ${
                    contenuTouched && contenuError
                      ? styles.error
                      : contenuTouched
                      ? styles.valid
                      : ""
                  }`}
                />

                {contenuTouched && !contenuError && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {contenuTouched && contenuError && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>

              {contenuTouched && contenuError && (
                <p className={styles.errorText}>
                  {contenuError}
                </p>
              )}
            </div>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addInterieur}>
        <FaPlus /> Ajouter une caractéristique intérieure
      </button>

      {/* EXTERIEUR */}
      <h3 className={styles.sectionTitle}>
        Caractéristiques extérieures
      </h3>

      <div className={styles.checkboxGrid}>
        {EXTERIEUR_DEFAULT.map((item) => (
          <label key={item} className={styles.checkbox}>
            <input
              type="checkbox"
              checked={caracteristiques.exterieur.includes(item)}
              onChange={(e) => {
                const list = e.target.checked
                  ? [...caracteristiques.exterieur, item]
                  : caracteristiques.exterieur.filter(
                      (i) => i !== item
                    );
                updateCaracteristiques({ exterieur: list });
              }}
            />
            {item}
          </label>
        ))}
      </div>

      {caracteristiques.exterieur_autres.map((item, index) => {
        const touchedItem = touched.exterieur_autres[index];
        const error = validateText(item);

        return (
          <div key={index} className={styles.otherField}>
            <div className={styles.field}>
              <label className={styles.label}>
                <FaAlignLeft /> Autre caractéristique *
              </label>

              <div className={styles.inputWrapper}>
                <input
                  value={item}
                  onChange={(e) => {
                    const list = [
                      ...caracteristiques.exterieur_autres,
                    ];
                    list[index] = e.target.value;
                    updateCaracteristiques({
                      exterieur_autres: list,
                    });

                    setTouched((p) => {
                      const t = [...p.exterieur_autres];
                      t[index] = true;
                      return {
                        ...p,
                        exterieur_autres: t,
                      };
                    });
                    if (typeof setBackendErrors === 'function') {
                      const newVal = e.target.value;
                      const err = validateText(newVal);
                      if (!err) {
                        setBackendErrors((prev) => {
                          const copy = { ...prev };
                          delete copy[`exterieur_autres_${index}`];
                          return copy;
                        });
                      }
                    }
                  }}
                  className={`${styles.input} ${
                    touchedItem && error
                      ? styles.error
                      : touchedItem
                      ? styles.valid
                      : ""
                  }`}
                />

                {touchedItem && !error && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
                {touchedItem && error && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
              </div>

              {touchedItem && error && (
                <p className={styles.errorText}>{error}</p>
              )}
            </div>

            <button onClick={() => removeExterieurAutre(index)}>
              <FaTrash />
            </button>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addExterieurAutre}>
        <FaPlus /> Ajouter autre caractéristique extérieure
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

export default Step3Caracteristiques;
