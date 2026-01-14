import React, { useEffect, useState, useCallback } from "react";
import styles from "./Step1InformationsGenerales.module.css";

/* =========================
   ICÔNES
========================= */
import {
  FaHome,
  FaHandshake,
  FaInfoCircle,
  FaCouch,
  FaCalendarAlt,
  FaRulerCombined,
  FaMoneyBillWave,
  FaAlignLeft,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

/* =========================
   OPTIONS AUTORISÉES
========================= */
const OPTIONS = {
  type_bien: ["Appartement", "Maison", "Terrain", "Bureau", "Boutique"],
  type_offre: ["Location", "Vente"],
  statut: ["Disponible", "Occupé"],
  meuble: ["Oui", "Non"],
  frais_visite: ["Oui", "Non"],
};

/* =========================
   VALIDATION
========================= */
const FORBIDDEN_CHARS_REGEX =
  /[~`•√π÷×§∆£¥$¢^°={}\\%©®™✓[\]><!?@#,€]/;

const SURFACE_REGEX = /^[0-9a-zA-Z²\s]+$/;

const extractDigits = (v) => v.replace(/\D/g, "");
const formatFCFA = (d) =>
  d ? new Intl.NumberFormat("fr-FR").format(d) + " FCFA" : "";

/* =========================
   COMPONENT
========================= */
const Step1InformationsGenerales = ({
  formData,
  setFormData,
  nextStep,
  backendErrors = {},
  setBackendErrors,
  isRestoredFromStorage = false,
}) => {
  const [touched, setTouched] = useState({});
  const [blurred, setBlurred] = useState({});
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);

  const informations = formData.informations_generales || {};
  const isTerrain = informations.type_bien === "Terrain";

  /* =========================
     VALIDATION CHAMP
  ========================= */
  const validateField = useCallback((name, rawValue) => {
    if (!rawValue) return null;

    const value = rawValue.trim();

    if (name !== "surface" && FORBIDDEN_CHARS_REGEX.test(value)) {
      return "Caractères spéciaux non autorisés";
    }

    if (name === "surface" && !SURFACE_REGEX.test(value)) {
      return "Surface invalide (chiffres, lettres et m² uniquement)";
    }

    if (OPTIONS[name] && !OPTIONS[name].includes(value)) {
      return "Option invalide";
    }

    if (["prix_bien", "prix_visite"].includes(name)) {
      if (!extractDigits(value)) {
        return "Montant invalide";
      }
    }

    if (name === "titre" && (value.length < 2 || value.length > 100)) {
      return "Entre 2 et 100 caractères";
    }

    if (name === "description" && (value.length < 10 || value.length > 1000)) {
      return "Entre 10 et 1000 caractères";
    }

    return null;
  }, []);

  /* =========================
     BLUR (SORTIE DE CHAMP)
  ========================= */
  const handleBlur = (name) => {
    setBlurred((prev) => ({ ...prev, [name]: true }));
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validation immédiate sur blur
    const value = informations[name] || "";
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
    const required = [
      "type_bien",
      "type_offre",
      "prix_bien",
      "frais_visite",
      "titre",
      "description",
    ];

    if (isTerrain) required.push("surface");
    if (!isTerrain) required.push("statut", "meuble", "disponibilite");

    if (informations.frais_visite === "Oui") {
      required.push("prix_visite");
    }

    return required.includes(name);
  };

  /* =========================
     CHANGE
  ========================= */
  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      informations_generales: {
        ...prev.informations_generales,
        [name]: value,
      },
    }));

    setTouched((prev) => ({ ...prev, [name]: true }));

    // Supprimer l'erreur backend pour ce champ si l'utilisateur modifie
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
  useEffect(() => {
    if (!isTerrain) return;

    setFormData((prev) => {
      const clean = { ...(prev.informations_generales || {}) };
      delete clean.statut;
      delete clean.meuble;
      delete clean.disponibilite;

      return {
        ...prev,
        informations_generales: clean,
      };
    });
  }, [isTerrain, setFormData]);

  /* =========================
     RESTAURATION STORAGE
  ========================= */
  useEffect(() => {
    if (!isRestoredFromStorage) return;

    const newTouched = {};
    const newErrors = {};

    Object.entries(informations).forEach(([field, value]) => {
      newTouched[field] = true;
      const err = validateField(field, value);
      if (err) newErrors[field] = err;
    });

    setTouched(newTouched);
    setErrors(newErrors);
  }, [isRestoredFromStorage, informations, validateField]);

  // Marquer touched depuis erreurs backend pour afficher bordures/erreurs
  useEffect(() => {
    if (!backendErrors) return;
    const fields = [
      "type_bien",
      "type_offre",
      "statut",
      "meuble",
      "disponibilite",
      "surface",
      "prix_bien",
      "frais_visite",
      "prix_visite",
      "titre",
      "description",
    ];

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
    const required = [
      "type_bien",
      "type_offre",
      "prix_bien",
      "frais_visite",
      "titre",
      "description",
    ];

    if (isTerrain) required.push("surface");
    if (!isTerrain) required.push("statut", "meuble", "disponibilite");

    if (informations.frais_visite === "Oui") {
      required.push("prix_visite");
    }

    const newErrors = {};

    // Ne valider que les champs qui ont été touchés ou blurred
    Object.keys(touched).forEach((field) => {
      const value = informations[field];
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
        const value = informations[field];
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
      const value = informations[field];
      return value && !validateField(field, value);
    });

    setIsValid(allRequiredValid && Object.keys(newErrors).length === 0);
  }, [informations, isTerrain, backendErrors, validateField, touched, blurred]);

  /* =========================
     RENDER CHAMP
  ========================= */
  const renderField = ({
    label,
    icon,
    name,
    type,
    options = [],
    fullWidth,
    isPrice,
    required = false,
  }) => {
    const value = informations[name] || "";
    const isTouched = touched[name];
    const error = errors[name];

    const stateClass =
      isTouched && error
        ? styles.error
        : isTouched && !error
        ? styles.valid
        : "";

    return (
      <div className={`${styles.field} ${fullWidth ? styles.fullWidth : ""}`}>
        <label className={styles.label}>
          <span className={styles.labelIcon}>{icon}</span>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>

        <div className={styles.inputWrapper}>
          {type === "select" && (
            <select
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={() => handleBlur(name)}
              onFocus={() => handleFocus(name)}
              className={`${styles.input} ${stateClass}`}
            >
              <option value="">Sélectionner</option>
              {options.map((opt) => (
                <option key={opt}>{opt}</option>
              ))}
            </select>
          )}

          {type === "input" && !isPrice && (
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={() => handleBlur(name)}
              onFocus={() => handleFocus(name)}
              className={`${styles.input} ${stateClass}`}
            />
          )}

          {type === "input" && isPrice && (
            <input
              type="text"
              placeholder="Ex : 250 000 FCFA"
              value={value}
              onChange={(e) =>
                handleChange(
                  name,
                  formatFCFA(extractDigits(e.target.value))
                )
              }
              onBlur={() => handleBlur(name)}
              onFocus={() => handleFocus(name)}
              className={`${styles.input} ${stateClass}`}
            />
          )}

          {type === "textarea" && (
            <textarea
              rows="5"
              maxLength={1000}
              value={value}
              onChange={(e) => handleChange(name, e.target.value)}
              onBlur={() => handleBlur(name)}
              onFocus={() => handleFocus(name)}
              className={`${styles.input} ${stateClass}`}
            />
          )}

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

        {type === "textarea" && (
          <div className={styles.charCount}>
            {value.length} / 1000 caractères
          </div>
        )}
      </div>
    );
  };

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Informations générales</h2>
      <p className={styles.stepDescription}>
        Renseignez avec précision les informations essentielles du bien.
      </p>

      <div className={styles.grid}>
        {renderField({
          label: "Type de bien",
          icon: <FaHome />,
          name: "type_bien",
          type: "select",
          options: OPTIONS.type_bien,
          required: true,
        })}

        {renderField({
          label: "Type d’offre",
          icon: <FaHandshake />,
          name: "type_offre",
          type: "select",
          options: OPTIONS.type_offre,
          required: true,
        })}

        {!isTerrain &&
          renderField({
            label: "Statut",
            icon: <FaInfoCircle />,
            name: "statut",
            type: "select",
            options: OPTIONS.statut,
            required: true,
          })}

        {!isTerrain &&
          renderField({
            label: "Meublé",
            icon: <FaCouch />,
            name: "meuble",
            type: "select",
            options: OPTIONS.meuble,
            required: true,
          })}

        {!isTerrain &&
          renderField({
            label: "Disponibilité",
            icon: <FaCalendarAlt />,
            name: "disponibilite",
            type: "input",
            required: true,
          })}

        {renderField({
          label: "Surface (m²)",
          icon: <FaRulerCombined />,
          name: "surface",
          type: "input",
          required: isTerrain,
        })}

        {renderField({
          label: "Prix du bien",
          icon: <FaMoneyBillWave />,
          name: "prix_bien",
          type: "input",
          isPrice: true,
          required: true,
        })}

        {renderField({
          label: "Frais de visite",
          icon: <FaMoneyBillWave />,
          name: "frais_visite",
          type: "select",
          options: OPTIONS.frais_visite,
          required: true,
        })}

        {informations.frais_visite === "Oui" &&
          renderField({
            label: "Prix visite",
            icon: <FaMoneyBillWave />,
            name: "prix_visite",
            type: "input",
            isPrice: true,
            required: true,
          })}

        {renderField({
          label: "Titre de l’annonce",
          icon: <FaAlignLeft />,
          name: "titre",
          type: "input",
          fullWidth: true,
          required: true,
        })}
      </div>

      {renderField({
        label: "Description",
        icon: <FaAlignLeft />,
        name: "description",
        type: "textarea",
        fullWidth: true,
        required: true,
      })}

      <button
        className={styles.nextBtn}
        disabled={!isValid}
        onClick={nextStep}
      >
        Suivant
      </button>
    </>
  );
};

export default Step1InformationsGenerales;
