import React, { useState, useEffect, useCallback } from "react";
import styles from "./publierBien.module.css";
import axios from "axios";

// Regex commun pour validation des caractères autorisés
const autorisesRegex = /[^a-zA-Z0-9\s.,\-'(){}àâéèêùûîïôœç]/u;

// Composant principal du formulaire multi-étapes
export default function PublierBienForm() {
  // Gestion des étapes
  const [step, setStep] = useState(0);
  const totalSteps = 8;
  const stepNames = [
    "INFORMATIONS GÉNÉRALES",
    "LOCALISATION",
    "CARACTÉRISTIQUES",
    "DOCUMENTS",
    "ACCESSIBILITÉ",
    "COMMODITÉS À PROXIMITÉ",
    "CONDITION DE PAIE & BONUS",
    "PHOTOS & VIDÉOS"
  ];

  // Définition des données initiales
  const initialFormData = {
    // Étape 1
    typeBien: "",
    typeOffre: "",
    statut: "",
    meuble: "",
    disponibilite: "",
    surface: "",
    fraisVisite: "",
    prixVisite: "",
    titreAnnonce: "",
    descriptionBien: "",
    // Étape 2
    ville: "",
    commune: "",
    quartier: "",
    latitude: "",
    longitude: "",
    // Étape 3
    interieur: [],
    exterieurChecked: [],
    exterieurAutres: [],
    // Étape 4
    documents: [],
    // Étape 5
    accessibiliteChecked: [],
    accessibiliteAutres: [],
    // Étape 6
    commoditeChecked: [],
    commoditeAutres: [],
    // Étape 7
    conditionsPaiement: [],
    bonus: [],
    // Étape 8 - fichiers exclus du localStorage
    photoPrincipale: null,
    pieces: [],
    video: { platform: "", url: "" },
  };

  // Chargement initial depuis localStorage - EXCLURE les fichiers
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem("publierBienFormData");
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Réinitialiser les champs de fichiers
      return {
        ...initialFormData,
        ...parsedData,
        photoPrincipale: null,
        pieces: parsedData.pieces ? parsedData.pieces.map(piece => ({
          ...piece,
          photos: []
        })) : [],
        video: parsedData.video || { platform: "", url: "" }
      };
    }
    return initialFormData;
  });

  // Gestion des erreurs
  const [errors, setErrors] = useState({});
  // Validation visuelle
  const [fieldValidation, setFieldValidation] = useState({});
  // Centralisation de l'état touched pour toutes les étapes
  const [touched, setTouched] = useState({});

  // Barre de progression
  const progress = ((step + 1) / totalSteps) * 100;

  // Navigation entre les étapes
  const nextStep = () => setStep((s) => Math.min(s + 1, totalSteps - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // Sauvegarde automatique dans localStorage (exclure fichiers)
  useEffect(() => {
    const dataToSave = {
      ...formData,
      photoPrincipale: null,
      pieces: formData.pieces.map(piece => ({
        name: piece.name,
        photos: [] // Exclure les fichiers photos
      })),
    };
    localStorage.setItem("publierBienFormData", JSON.stringify(dataToSave));
  }, [formData]);

  // Effacer localStorage après publication
  const clearLocalStorage = () => {
    localStorage.removeItem("publierBienFormData");
  };

  // Validation de tous les champs au chargement
  const validateAllFieldsOnLoad = useCallback(() => {
    const newValidation = {};
    
    // Validation Étape 1
    if (formData.typeBien && formData.typeBien.length >= 2 && formData.typeBien.length <= 100 && !autorisesRegex.test(formData.typeBien)) {
      newValidation.typeBien = true;
    }
    if (formData.typeOffre && ["louer", "vendre"].includes(formData.typeOffre)) {
      newValidation.typeOffre = true;
    }
    if (formData.statut && ["neuf", "Déjà habité"].includes(formData.statut)) {
      newValidation.statut = true;
    }
    if (formData.meuble && ["oui", "non"].includes(formData.meuble)) {
      newValidation.meuble = true;
    }
    if (formData.disponibilite && formData.disponibilite.length >= 2 && formData.disponibilite.length <= 500 && !autorisesRegex.test(formData.disponibilite)) {
      newValidation.disponibilite = true;
    }
    if (formData.surface && /^[0-9a-zA-Z\s.,m²]+$/u.test(formData.surface) && formData.surface.length >= 1 && formData.surface.length <= 20) {
      newValidation.surface = true;
    }
    if (formData.fraisVisite && ["oui", "non"].includes(formData.fraisVisite)) {
      newValidation.fraisVisite = true;
    }
    if (formData.prixVisite && formData.fraisVisite === "oui" && /^[0-9\s.,a-zA-Z]+$/u.test(formData.prixVisite) && formData.prixVisite.length >= 1 && formData.prixVisite.length <= 20) {
      newValidation.prixVisite = true;
    }
    if (formData.titreAnnonce && formData.titreAnnonce.length >= 2 && formData.titreAnnonce.length <= 100 && !autorisesRegex.test(formData.titreAnnonce)) {
      newValidation.titreAnnonce = true;
    }
    if (formData.descriptionBien && formData.descriptionBien.length >= 2 && formData.descriptionBien.length <= 500 && !autorisesRegex.test(formData.descriptionBien)) {
      newValidation.descriptionBien = true;
    }

    // Validation Étape 2
    if (formData.ville && formData.ville.length >= 2 && formData.ville.length <= 100 && !autorisesRegex.test(formData.ville)) {
      newValidation.ville = true;
    }
    if (formData.commune && formData.ville.trim().toLowerCase() === "abidjan" && formData.commune.length >= 2 && formData.commune.length <= 100 && !autorisesRegex.test(formData.commune)) {
      newValidation.commune = true;
    }
    if (formData.quartier && formData.quartier.length >= 2 && formData.quartier.length <= 100 && !autorisesRegex.test(formData.quartier)) {
      newValidation.quartier = true;
    }

    // Validation champs dynamiques
    // Intérieur
    formData.interieur.forEach((item, i) => {
      if (item.titre && item.titre.length >= 2 && item.titre.length <= 100 && !autorisesRegex.test(item.titre)) {
        newValidation[`interieur_titre_${i}`] = true;
      }
      if (item.contenu && item.contenu.length >= 2 && item.contenu.length <= 500 && !autorisesRegex.test(item.contenu)) {
        newValidation[`interieur_contenu_${i}`] = true;
      }
    });

    // Extérieur autres
    formData.exterieurAutres.forEach((val, i) => {
      if (val && val.length >= 2 && val.length <= 100 && !autorisesRegex.test(val)) {
        newValidation[`exterieurAutres_${i}`] = true;
      }
    });

    // Documents
    formData.documents.forEach((doc, i) => {
      if (doc.nom && doc.nom.length >= 2 && doc.nom.length <= 100 && !autorisesRegex.test(doc.nom)) {
        newValidation[`documents_${i}`] = true;
      }
    });

    // Accessibilité autres
    formData.accessibiliteAutres.forEach((val, i) => {
      if (val && val.length >= 2 && val.length <= 100 && !autorisesRegex.test(val)) {
        newValidation[`accessibiliteAutres_${i}`] = true;
      }
    });

    // Commodité autres
    formData.commoditeAutres.forEach((val, i) => {
      if (val && val.length >= 2 && val.length <= 100 && !autorisesRegex.test(val)) {
        newValidation[`commoditeAutres_${i}`] = true;
      }
    });

    // Conditions de paiement
    formData.conditionsPaiement.forEach((val, i) => {
      if (val && val.length >= 2 && val.length <= 200 && !autorisesRegex.test(val)) {
        newValidation[`conditionsPaiement_${i}`] = true;
      }
    });

    // Bonus
    formData.bonus.forEach((val, i) => {
      if (val && val.length >= 2 && val.length <= 100 && !autorisesRegex.test(val)) {
        newValidation[`bonus_${i}`] = true;
      }
    });

    // Validation Étape 8 (champs texte seulement)
    if (formData.video.platform) {
      newValidation.videoPlatform = true;
    }
    if (formData.video.url && formData.video.url.length >= 10) {
      newValidation.videoUrl = true;
    }

    // Pièces
    formData.pieces.forEach((piece, i) => {
      if (piece.name && piece.name.length >= 2 && piece.name.length <= 50 && !autorisesRegex.test(piece.name)) {
        newValidation[`pieceName_${i}`] = true;
      }
    });

    setFieldValidation(newValidation);
  }, [formData]);

  // Validation au chargement initial
  useEffect(() => {
    validateAllFieldsOnLoad();
  }, [validateAllFieldsOnLoad]);

  // Affichage de l'étape courante
  const renderStep = () => {
    const stepProps = {
      formData, 
      setFormData, 
      errors, 
      setErrors, 
      fieldValidation, 
      setFieldValidation, 
      touched, 
      setTouched
    };
    
    switch (step) {
      case 0:
        return <Step1 {...stepProps} nextStep={nextStep} />;
      case 1:
        return <Step2 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 2:
        return <Step3 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 3:
        return <Step4 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 4:
        return <Step5 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 5:
        return <Step6 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 6:
        return <Step7 {...stepProps} nextStep={nextStep} prevStep={prevStep} />;
      case 7:
        return <Step8 {...stepProps} prevStep={prevStep} clearLocalStorage={clearLocalStorage} />;
      default:
        return null;
    }
  };

  return (
    <form className={styles.multiStepForm}>
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }}></div>
      </div>
      <div className={styles.stepIndicator}>
        {stepNames[step]} - Étape {step + 1} sur {totalSteps}
      </div>
      <div className={styles.stepContent}>{renderStep()}</div>
    </form>
  );
}

// Étape 1 : Informations Générales
function Step1({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep }) {
  // Icônes SVG
  const icons = {
    typeBien: <span className={styles.iconLabel}>🏠</span>,
    typeOffre: <span className={styles.iconLabel}>📄</span>,
    statut: <span className={styles.iconLabel}>📦</span>,
    meuble: <span className={styles.iconLabel}>🛋️</span>,
    disponibilite: <span className={styles.iconLabel}>⏰</span>,
    surface: <span className={styles.iconLabel}>📏</span>,
    fraisVisite: <span className={styles.iconLabel}>💸</span>,
    prixVisite: <span className={styles.iconLabel}>💰</span>,
    titreAnnonce: <span className={styles.iconLabel}>📝</span>,
    descriptionBien: <span className={styles.iconLabel}>🗒️</span>
  };

  // Gestion du compteur de caractères pour la description
  const [charCount, setCharCount] = useState(formData.descriptionBien ? formData.descriptionBien.length : 0);
  const [canProceed, setCanProceed] = useState(false);
  const [touched, setTouched] = useState({});

  // Validation stricte
  const allowedTypeOffre = ["louer", "vendre"];
  const allowedStatut = ["neuf", "Déjà habité"];
  const allowedMeuble = ["oui", "non"];
  const allowedFraisVisite = ["oui", "non"];

  // Validation en temps réel
  const validateField = useCallback((field, value) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    
    switch (field) {
      case "typeBien":
        if (!value) {
          newErrors.typeBien = "Type de bien requis";
          delete newValidation.typeBien;
        } else if (value.length < 2) {
          newErrors.typeBien = "Min 2 caractères";
          delete newValidation.typeBien;
        } else if (value.length > 100) {
          newErrors.typeBien = "Max 100 caractères";
          delete newValidation.typeBien;
        } else if (autorisesRegex.test(value)) {
          newErrors.typeBien = "Caractères non autorisés";
          delete newValidation.typeBien;
        } else {
          delete newErrors.typeBien;
          newValidation.typeBien = true;
        }
        break;
        
      case "typeOffre":
        if (!value) {
          newErrors.typeOffre = "Sélectionnez une option";
          delete newValidation.typeOffre;
        } else if (!allowedTypeOffre.includes(value)) {
          newErrors.typeOffre = "Option non autorisée";
          delete newValidation.typeOffre;
        } else {
          delete newErrors.typeOffre;
          newValidation.typeOffre = true;
        }
        break;
        
      case "statut":
        if (!value) {
          newErrors.statut = "Sélectionnez une option";
          delete newValidation.statut;
        } else if (!allowedStatut.includes(value)) {
          newErrors.statut = "Option non autorisée";
          delete newValidation.statut;
        } else {
          delete newErrors.statut;
          newValidation.statut = true;
        }
        break;
        
      case "meuble":
        if (!value) {
          newErrors.meuble = "Sélectionnez une option";
          delete newValidation.meuble;
        } else if (!allowedMeuble.includes(value)) {
          newErrors.meuble = "Option non autorisée";
          delete newValidation.meuble;
        } else {
          delete newErrors.meuble;
          newValidation.meuble = true;
        }
        break;
        
      case "disponibilite":
        if (!value) {
          newErrors.disponibilite = "Disponibilité requise";
          delete newValidation.disponibilite;
        } else if (value.length < 2) {
          newErrors.disponibilite = "Min 2 caractères";
          delete newValidation.disponibilite;
        } else if (value.length > 500) {
          newErrors.disponibilite = "Max 500 caractères";
          delete newValidation.disponibilite;
        } else if (autorisesRegex.test(value)) {
          newErrors.disponibilite = "Caractères non autorisés";
          delete newValidation.disponibilite;
        } else {
          delete newErrors.disponibilite;
          newValidation.disponibilite = true;
        }
        break;
        
      case "surface":
        if (value && !/^[0-9a-zA-Z\s.,m²]+$/u.test(value)) {
          newErrors.surface = "Surface invalide. Seuls les chiffres, lettres, espaces, points, virgules, 'm' et '²' sont autorisés.";
          delete newValidation.surface;
        } else if (value && (value.length < 1 || value.length > 20)) {
          newErrors.surface = "Surface trop courte ou trop longue.";
          delete newValidation.surface;
        } else if (value) {
          delete newErrors.surface;
          newValidation.surface = true;
        } else {
          delete newErrors.surface;
          delete newValidation.surface;
        }
        break;
        
      case "fraisVisite":
        if (!value) {
          newErrors.fraisVisite = "Sélectionnez une option";
          delete newValidation.fraisVisite;
        } else if (!allowedFraisVisite.includes(value)) {
          newErrors.fraisVisite = "Option non autorisée";
          delete newValidation.fraisVisite;
        } else {
          delete newErrors.fraisVisite;
          newValidation.fraisVisite = true;
        }
        break;
        
      case "prixVisite":
        if (formData.fraisVisite === "oui" && !value) {
          newErrors.prixVisite = "Veuillez saisir le prix du frais de visite.";
          delete newValidation.prixVisite;
        } else if (formData.fraisVisite === "oui" && !/^[0-9\s.,a-zA-Z]+$/u.test(value)) {
          newErrors.prixVisite = "Prix de visite invalide.";
          delete newValidation.prixVisite;
        } else if (formData.fraisVisite === "oui" && (value.length < 1 || value.length > 20)) {
          newErrors.prixVisite = "Prix de visite trop court ou trop long.";
          delete newValidation.prixVisite;
        } else if (formData.fraisVisite === "oui") {
          delete newErrors.prixVisite;
          newValidation.prixVisite = true;
        } else {
          delete newErrors.prixVisite;
          delete newValidation.prixVisite;
        }
        break;
        
      case "titreAnnonce":
        if (!value) {
          newErrors.titreAnnonce = "Titre requis";
          delete newValidation.titreAnnonce;
        } else if (value.length < 2) {
          newErrors.titreAnnonce = "Min 2 caractères";
          delete newValidation.titreAnnonce;
        } else if (value.length > 100) {
          newErrors.titreAnnonce = "Max 100 caractères";
          delete newValidation.titreAnnonce;
        } else if (autorisesRegex.test(value)) {
          newErrors.titreAnnonce = "Caractères non autorisés";
          delete newValidation.titreAnnonce;
        } else {
          delete newErrors.titreAnnonce;
          newValidation.titreAnnonce = true;
        }
        break;
        
      case "descriptionBien":
        if (!value) {
          newErrors.descriptionBien = "Description requise";
          delete newValidation.descriptionBien;
        } else if (value.length < 2) {
          newErrors.descriptionBien = "Min 2 caractères";
          delete newValidation.descriptionBien;
        } else if (value.length > 500) {
          newErrors.descriptionBien = "Max 500 caractères";
          delete newValidation.descriptionBien;
        } else if (autorisesRegex.test(value)) {
          newErrors.descriptionBien = "Caractères non autorisés";
          delete newValidation.descriptionBien;
        } else {
          delete newErrors.descriptionBien;
          newValidation.descriptionBien = true;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  }, [errors, fieldValidation, formData.fraisVisite]);

  const checkCanProceed = useCallback(() => {
    // Type de bien
    if (!formData.typeBien || formData.typeBien.length < 2 || formData.typeBien.length > 100 || autorisesRegex.test(formData.typeBien)) return false;
    // Type d'offre
    if (!formData.typeOffre) return false;
    // Statut
    if (!formData.statut) return false;
    // Meublé
    if (!formData.meuble) return false;
    // Disponibilité
    if (!formData.disponibilite || formData.disponibilite.length < 2 || formData.disponibilite.length > 500 || autorisesRegex.test(formData.disponibilite)) return false;
    // Surface (optionnel)
    if (formData.surface && (!/^[0-9a-zA-Z\s.,m²]+$/u.test(formData.surface) || formData.surface.length < 1 || formData.surface.length > 20)) return false;
    // Frais visite
    if (!formData.fraisVisite) return false;
    // Prix visite
    if (formData.fraisVisite === "oui" && (!formData.prixVisite || !/^[0-9\s.,a-zA-Z]+$/u.test(formData.prixVisite) || formData.prixVisite.length < 1 || formData.prixVisite.length > 20)) return false;
    // Titre annonce
    if (!formData.titreAnnonce || formData.titreAnnonce.length < 2 || formData.titreAnnonce.length > 100 || autorisesRegex.test(formData.titreAnnonce)) return false;
    // Description
    if (!formData.descriptionBien || formData.descriptionBien.length < 2 || formData.descriptionBien.length > 500 || autorisesRegex.test(formData.descriptionBien)) return false;
    return true;
  }, [formData]);

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, checkCanProceed]);

  // Gestion du bouton suivant
  const handleNext = () => {
    // Marquer tous les champs comme touchés pour afficher toutes les erreurs
    const allFields = ["typeBien", "typeOffre", "statut", "meuble", "disponibilite", "surface", "fraisVisite", "prixVisite", "titreAnnonce", "descriptionBien"];
    const newTouched = {};
    allFields.forEach(field => {
      newTouched[field] = true;
      validateField(field, formData[field]);
    });
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  // Gestion des changements de champs avec validation immédiate
  const handleChange = (field, value) => {
    setFormData(f => ({ ...f, [field]: value }));
    setTouched(t => ({ ...t, [field]: true }));
    validateField(field, value);
  };

  // Style dynamique pour input
  const getInputClass = field => {
    if (fieldValidation[field]) return styles.valid;
    if (touched[field] && errors[field]) return styles.invalid;
    return "";
  };

  // Icône de validation dans le champ
  const getInputIcon = field => {
    if (fieldValidation[field]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[field] && errors[field]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  return (
    <section className={styles.step}>
      <h1>INFORMATIONS GÉNÉRALES</h1>
      <p className={styles.subSectionDescription}>Fournissez des informations de base sur le bien que vous souhaitez publier.</p>
      
      <div className={styles.formGroup}>
        {icons.typeBien}
        <label htmlFor="typeBien" className={styles.required}>Type de bien</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            id="typeBien"
            value={formData.typeBien}
            onChange={e => handleChange("typeBien", e.target.value)}
            placeholder="Villa, Studio, etc..."
            required
            className={getInputClass("typeBien")}
          />
          {getInputIcon("typeBien")}
        </div>
        {touched.typeBien && errors.typeBien && <div className={styles.errorMessage}>{errors.typeBien}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.typeOffre}
        <label htmlFor="typeOffre" className={styles.required}>Type d'offre</label>
        <div className={styles.inputWrapper}>
          <select
            id="typeOffre"
            value={formData.typeOffre}
            onChange={e => handleChange("typeOffre", e.target.value)}
            required
            className={getInputClass("typeOffre")}
          >
            <option value="">Choisir le type d'offre</option>
            <option value="louer">À louer</option>
            <option value="vendre">À vendre</option>
          </select>
          {getInputIcon("typeOffre")}
        </div>
        {touched.typeOffre && errors.typeOffre && <div className={styles.errorMessage}>{errors.typeOffre}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.statut}
        <label htmlFor="statut" className={styles.required}>Statut du bien</label>
        <div className={styles.inputWrapper}>
          <select
            id="statut"
            value={formData.statut}
            onChange={e => handleChange("statut", e.target.value)}
            required
            className={getInputClass("statut")}
          >
            <option value="">Choisir le statut</option>
            <option value="neuf">Neuf</option>
            <option value="Déjà habité">Déjà habité</option>
          </select>
          {getInputIcon("statut")}
        </div>
        {touched.statut && errors.statut && <div className={styles.errorMessage}>{errors.statut}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.meuble}
        <label htmlFor="meuble" className={styles.required}>Bien meublé</label>
        <div className={styles.inputWrapper}>
          <select
            id="meuble"
            value={formData.meuble}
            onChange={e => handleChange("meuble", e.target.value)}
            required
            className={getInputClass("meuble")}
          >
            <option value="">Choisir une option</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
          {getInputIcon("meuble")}
        </div>
        {touched.meuble && errors.meuble && <div className={styles.errorMessage}>{errors.meuble}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.disponibilite}
        <label htmlFor="disponibilite" className={styles.required}>Disponibilité</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            id="disponibilite"
            value={formData.disponibilite}
            onChange={e => handleChange("disponibilite", e.target.value)}
            placeholder="Immédiat, sous 1 mois, etc..."
            required
            className={getInputClass("disponibilite")}
          />
          {getInputIcon("disponibilite")}
        </div>
        {touched.disponibilite && errors.disponibilite && <div className={styles.errorMessage}>{errors.disponibilite}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.surface}
        <label htmlFor="surface">Surface du bien</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            id="surface"
            value={formData.surface}
            onChange={e => handleChange("surface", e.target.value)}
            placeholder="400m²"
            className={getInputClass("surface")}
          />
          {getInputIcon("surface")}
        </div>
        {touched.surface && errors.surface && <div className={styles.errorMessage}>{errors.surface}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.fraisVisite}
        <label htmlFor="fraisVisite" className={styles.required}>Prenez-vous des frais de visite ?</label>
        <div className={styles.inputWrapper}>
          <select
            id="fraisVisite"
            value={formData.fraisVisite}
            onChange={e => handleChange("fraisVisite", e.target.value)}
            required
            className={getInputClass("fraisVisite")}
          >
            <option value="">Choisir une option</option>
            <option value="oui">Oui</option>
            <option value="non">Non</option>
          </select>
          {getInputIcon("fraisVisite")}
        </div>
        {touched.fraisVisite && errors.fraisVisite && <div className={styles.errorMessage}>{errors.fraisVisite}</div>}
      </div>

      {formData.fraisVisite === "oui" && (
        <div className={styles.formGroup}>
          {icons.prixVisite}
          <label htmlFor="prixVisite" className={styles.required}>Entrez le prix du frais de visite</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="prixVisite"
              value={formData.prixVisite}
              onChange={e => handleChange("prixVisite", e.target.value)}
              placeholder="2000fr"
              className={getInputClass("prixVisite")}
            />
            {getInputIcon("prixVisite")}
          </div>
          {touched.prixVisite && errors.prixVisite && <div className={styles.errorMessage}>{errors.prixVisite}</div>}
        </div>
      )}

      <div className={styles.formGroup}>
        {icons.titreAnnonce}
        <label htmlFor="titreAnnonce" className={styles.required}>Titre de l'annonce</label>
        <div className={styles.inputWrapper}>
          <input
            type="text"
            id="titreAnnonce"
            value={formData.titreAnnonce}
            onChange={e => handleChange("titreAnnonce", e.target.value)}
            placeholder="Studio à Cocody riviera..."
            required
            className={getInputClass("titreAnnonce")}
          />
          {getInputIcon("titreAnnonce")}
        </div>
        {touched.titreAnnonce && errors.titreAnnonce && <div className={styles.errorMessage}>{errors.titreAnnonce}</div>}
      </div>

      <div className={styles.formGroup}>
        {icons.descriptionBien}
        <label htmlFor="descriptionBien" className={styles.required}>Description du bien</label>
        <div className={styles.inputWrapper}>
          <textarea
            id="descriptionBien"
            value={formData.descriptionBien}
            onChange={e => {
              handleChange("descriptionBien", e.target.value);
              setCharCount(e.target.value.length);
            }}
            placeholder="Décrivez votre bien en détail (5 lignes maximum)"
            maxLength={500}
            required
            className={getInputClass("descriptionBien")}
          />
          {getInputIcon("descriptionBien")}
        </div>
        <small className={styles.charCounter}>
          <span>{charCount}</span>/500 caractères
        </small>
        {touched.descriptionBien && errors.descriptionBien && <div className={styles.errorMessage}>{errors.descriptionBien}</div>}
      </div>

      <button 
        type="button" 
        className={styles.btnNext1} 
        onClick={handleNext} 
        disabled={!canProceed}
      >
        Suivant
      </button>
    </section>
  );
}

// Étape 2 : Localisation
function Step2({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    ville: <span className={styles.iconLabel}>🏙️</span>,
    commune: <span className={styles.iconLabel}>🏢</span>,
    quartier: <span className={styles.iconLabel}>📍</span>,
    mapSearch: <span className={styles.iconLabel}>🗺️</span>
  };
  
  const [canProceed, setCanProceed] = useState(false);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = useCallback((field, value) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    
    switch (field) {
      case "ville":
        if (!value) {
          newErrors.ville = "Ville requise";
          delete newValidation.ville;
        } else if (value.length < 2) {
          newErrors.ville = "Min 2 caractères";
          delete newValidation.ville;
        } else if (value.length > 100) {
          newErrors.ville = "Max 100 caractères";
          delete newValidation.ville;
        } else if (autorisesRegex.test(value)) {
          newErrors.ville = "Caractères non autorisés";
          delete newValidation.ville;
        } else {
          delete newErrors.ville;
          newValidation.ville = true;
        }
        break;
        
      case "commune":
        if (formData.ville.trim().toLowerCase() === "abidjan") {
          if (!value) {
            newErrors.commune = "Commune requise";
            delete newValidation.commune;
          } else if (value.length < 2) {
            newErrors.commune = "Min 2 caractères";
            delete newValidation.commune;
          } else if (value.length > 100) {
            newErrors.commune = "Max 100 caractères";
            delete newValidation.commune;
          } else if (autorisesRegex.test(value)) {
            newErrors.commune = "Caractères non autorisés";
            delete newValidation.commune;
          } else {
            delete newErrors.commune;
            newValidation.commune = true;
          }
        } else {
          delete newErrors.commune;
          delete newValidation.commune;
        }
        break;
        
      case "quartier":
        if (!value) {
          newErrors.quartier = "Quartier requis";
          delete newValidation.quartier;
        } else if (value.length < 2) {
          newErrors.quartier = "Min 2 caractères";
          delete newValidation.quartier;
        } else if (value.length > 100) {
          newErrors.quartier = "Max 100 caractères";
          delete newValidation.quartier;
        } else if (autorisesRegex.test(value)) {
          newErrors.quartier = "Caractères non autorisés";
          delete newValidation.quartier;
        } else {
          delete newErrors.quartier;
          newValidation.quartier = true;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  }, [errors, fieldValidation, formData.ville]);

  const checkCanProceed = useCallback(() => {
    // Ville
    if (!formData.ville || formData.ville.length < 2 || formData.ville.length > 100 || autorisesRegex.test(formData.ville)) return false;
    
    // Commune (obligatoire si ville = Abidjan)
    if (formData.ville.trim().toLowerCase() === "abidjan") {
      if (!formData.commune || formData.commune.length < 2 || formData.commune.length > 100 || autorisesRegex.test(formData.commune)) return false;
    }
    
    // Quartier
    if (!formData.quartier || formData.quartier.length < 2 || formData.quartier.length > 100 || autorisesRegex.test(formData.quartier)) return false;
    
    return true;
  }, [formData]);

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, checkCanProceed]);

  // Gestion des changements de champs avec validation immédiate
  const handleChange = (field, value) => {
    setFormData(f => ({ ...f, [field]: value }));
    setTouched(t => ({ ...t, [field]: true }));
    validateField(field, value);
  };

  // Style dynamique pour input
  const getInputClass = field => {
    if (fieldValidation[field]) return styles.valid;
    if (touched[field] && errors[field]) return styles.invalid;
    return "";
  };

  // Icône de validation dans le champ
  const getInputIcon = field => {
    if (fieldValidation[field]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[field] && errors[field]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  const handleNext = () => {
    // Marquer tous les champs comme touchés pour afficher toutes les erreurs
    const allFields = ["ville", "commune", "quartier"];
    const newTouched = {};
    allFields.forEach(field => {
      newTouched[field] = true;
      validateField(field, formData[field]);
    });
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>LOCALISATION</h1>
      <p className={styles.subSectionDescription}>
        Indiquez l'emplacement exact de votre bien pour permettre aux acheteurs de le localiser facilement
      </p>
      
      <div className={styles.subSection}>
        <h3>Adresse du bien</h3>
        <div className={styles.formGroup}>
          {icons.ville}
          <label htmlFor="ville" className={styles.required}>Ville</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="ville"
              value={formData.ville}
              onChange={e => handleChange("ville", e.target.value)}
              placeholder="Abidjan, Bouaké, etc..."
              required
              className={getInputClass("ville")}
            />
            {getInputIcon("ville")}
          </div>
          {touched.ville && errors.ville && <div className={styles.errorMessage}>{errors.ville}</div>}
        </div>
        
        {formData.ville.trim().toLowerCase() === "abidjan" && (
          <div className={styles.formGroup}>
            {icons.commune}
            <label htmlFor="commune" className={styles.required}>Commune</label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                id="commune"
                value={formData.commune}
                onChange={e => handleChange("commune", e.target.value)}
                placeholder="Cocody, Yopougon, etc..."
                required
                className={getInputClass("commune")}
              />
              {getInputIcon("commune")}
            </div>
            {touched.commune && errors.commune && <div className={styles.errorMessage}>{errors.commune}</div>}
          </div>
        )}
        
        <div className={styles.formGroup}>
          {icons.quartier}
          <label htmlFor="quartier" className={styles.required}>Quartier</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="quartier"
              value={formData.quartier}
              onChange={e => handleChange("quartier", e.target.value)}
              placeholder="Riviera, etc..."
              required
              className={getInputClass("quartier")}
            />
            {getInputIcon("quartier")}
          </div>
          {touched.quartier && errors.quartier && <div className={styles.errorMessage}>{errors.quartier}</div>}
        </div>
      </div>
      
      <div className={styles.subSection}>
        <h3>Positionnement sur la carte</h3>
        <p className={styles.subSectionDescription}>
          Positionnez votre bien sur la carte pour une visualisation géographique précise (optionnel mais recommandé)
        </p>
        <div className={styles.formGroup}>
          {icons.mapSearch}
          <label htmlFor="mapSearch">Rechercher l'emplacement</label>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id="mapSearch"
              placeholder="Rechercher sur la carte..."
            />
          </div>
        </div>
        {/* Zone carte et coordonnées */}
        <div className={styles.uploadZoneCarte} id="zone-carte">
          <div className={styles.uploadIcon}>🗺️</div>
        </div>
        <input type="hidden" id="latitude" value={formData.latitude} />
        <input type="hidden" id="longitude" value={formData.longitude} />
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 3 : Caractéristiques (non obligatoire)
function Step3({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    titre: <span className={styles.iconLabel}>🏷️</span>,
    contenu: <span className={styles.iconLabel}>📝</span>,
    ext: <span className={styles.iconLabel}>🌳</span>
  };
  
  const [canProceed, setCanProceed] = useState(true);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = (field, value, index = null) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    const fieldKey = index !== null ? `${field}_${index}` : field;
    
    // Si le champ est vide et a été touché OU si c'est un nouveau bloc
    if (!value) {
      // Pour les nouveaux blocs, on valide immédiatement les deux champs
      if (touched[fieldKey] || (index !== null && field.includes('interieur'))) {
        newErrors[fieldKey] = "Champ requis";
        delete newValidation[fieldKey];
      }
    } else if (value.length < 2) {
      newErrors[fieldKey] = "Min 2 caractères";
      delete newValidation[fieldKey];
    } else if (value.length > (field.includes("contenu") ? 500 : 100)) {
      newErrors[fieldKey] = field.includes("contenu") ? "Max 500 caractères" : "Max 100 caractères";
      delete newValidation[fieldKey];
    } else if (autorisesRegex.test(value)) {
      newErrors[fieldKey] = "Caractères non autorisés";
      delete newValidation[fieldKey];
    } else {
      delete newErrors[fieldKey];
      newValidation[fieldKey] = true;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  const checkCanProceed = () => {
    // Si aucun bloc dynamique n'a été ajouté, bouton Suivant activé
    if (formData.interieur.length === 0 && formData.exterieurAutres.length === 0) {
      return true;
    }
    // Si au moins un bloc, il faut que tous les champs soient remplis et valides
    let valid = true;
    // Intérieur
    for (let i = 0; i < formData.interieur.length; i++) {
      const titre = formData.interieur[i].titre;
      const contenu = formData.interieur[i].contenu;
      if (!titre || !contenu || errors[`interieur_titre_${i}`] || errors[`interieur_contenu_${i}`]) {
        valid = false;
        break;
      }
    }
    // Extérieur autres
    for (let i = 0; i < formData.exterieurAutres.length; i++) {
      const val = formData.exterieurAutres[i];
      if (!val || errors[`exterieurAutres_${i}`]) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, errors]);

  // Style dynamique pour input
  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  // Icône de validation dans le champ
  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  // Suppression bloc
  const handleRemoveInterieur = i => {
    setFormData(f => {
      const arr = [...f.interieur];
      arr.splice(i, 1);
      return { ...f, interieur: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`interieur_titre_${i}`];
      delete newTouched[`interieur_contenu_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`interieur_titre_${i}`];
    delete newErrors[`interieur_contenu_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`interieur_titre_${i}`];
    delete newValidation[`interieur_contenu_${i}`];
    setFieldValidation(newValidation);
  };

  const handleRemoveExterieurAutres = i => {
    setFormData(f => {
      const arr = [...f.exterieurAutres];
      arr.splice(i, 1);
      return { ...f, exterieurAutres: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`exterieurAutres_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`exterieurAutres_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`exterieurAutres_${i}`];
    setFieldValidation(newValidation);
  };

  // Ajout en bas du tableau (push)
  const handleAddInterieur = () => {
    const idx = formData.interieur.length;
    setFormData(f => ({
      ...f,
      interieur: [...f.interieur, { titre: "", contenu: "" }]
    }));
    setTouched(t => ({
      ...t,
      [`interieur_titre_${idx}`]: true,
      [`interieur_contenu_${idx}`]: true
    }));
    setErrors(e => ({
      ...e,
      [`interieur_titre_${idx}`]: "Champ requis",
      [`interieur_contenu_${idx}`]: "Champ requis"
    }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`interieur_titre_${idx}`];
      delete nv[`interieur_contenu_${idx}`];
      return nv;
    });
  };

  const handleInterieurChange = (i, field, value) => {
    setFormData(f => {
      const arr = [...f.interieur];
      arr[i][field] = value;
      return { ...f, interieur: arr };
    });
    
    const fieldKey = `interieur_${field}_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField(`interieur_${field}`, value, i);
  };

  // Ajout en bas du tableau (push)
  const handleAddExterieurAutres = () => {
    setFormData(f => ({
      ...f,
      exterieurAutres: [...f.exterieurAutres, ""]
    }));
    setTouched(t => ({
      ...t,
      [`exterieurAutres_${formData.exterieurAutres.length}`]: false
    }));
    setTimeout(() => {
      validateField("exterieurAutres", "", formData.exterieurAutres.length);
    }, 0);
  };

  const handleExterieurAutresChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.exterieurAutres];
      arr[i] = value;
      return { ...f, exterieurAutres: arr };
    });
    const fieldKey = `exterieurAutres_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("exterieurAutres", value, i);
  };

  const exterieurs = ["Piscine", "Garage", "Balcon", "Parking", "Clôture", "Terrasse", "Cour"];

  const handleNext = () => {
    // Valider tous les champs existants
    const newTouched = { ...touched };
    
    formData.interieur.forEach((_, i) => {
      newTouched[`interieur_titre_${i}`] = true;
      newTouched[`interieur_contenu_${i}`] = true;
      validateField("interieur_titre", formData.interieur[i].titre, i);
      validateField("interieur_contenu", formData.interieur[i].contenu, i);
    });
    
    formData.exterieurAutres.forEach((_, i) => {
      newTouched[`exterieurAutres_${i}`] = true;
      validateField("exterieurAutres", formData.exterieurAutres[i], i);
    });
    
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>CARACTÉRISTIQUES</h1>
      
      {/* SECTION INTÉRIEURE */}
      <div className={styles.subSection}>
        <h3>Caractéristiques intérieure</h3>
        <p className={styles.subSectionDescription}>
          Détaillez les caractéristiques de votre bien pour mettre en valeur ses atouts principaux
        </p>
        
        {/* CHAMPS - Les nouveaux apparaissent au-dessus du bouton */}
        {formData.interieur.map((item, i) => (
          <div key={i} className={styles.dynamicBlock}>
            <div className={styles.formGroup}>
              {icons.titre}
              <label htmlFor={`interieur_titre_${i}`}>Titre</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  id={`interieur_titre_${i}`}
                  placeholder="Titre de la caractéristique"
                  value={item.titre}
                  onChange={e => handleInterieurChange(i, "titre", e.target.value)}
                  className={getInputClass("interieur_titre", i)}
                />
                {getInputIcon("interieur_titre", i)}
              </div>
              {touched[`interieur_titre_${i}`] && errors[`interieur_titre_${i}`] && (
                <div className={styles.errorMessage}>{errors[`interieur_titre_${i}`]}</div>
              )}
            </div>
            
            <div className={styles.formGroup}>
              {icons.contenu}
              <label htmlFor={`interieur_contenu_${i}`}>Contenu</label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  id={`interieur_contenu_${i}`}
                  placeholder="Description de la caractéristique"
                  value={item.contenu}
                  onChange={e => handleInterieurChange(i, "contenu", e.target.value)}
                  className={getInputClass("interieur_contenu", i)}
                />
                {getInputIcon("interieur_contenu", i)}
              </div>
              {touched[`interieur_contenu_${i}`] && errors[`interieur_contenu_${i}`] && (
                <div className={styles.errorMessage}>{errors[`interieur_contenu_${i}`]}</div>
              )}
            </div>
            
            <button 
              type="button" 
              className={styles.deleteIcon} 
              onClick={() => handleRemoveInterieur(i)}
              title="Supprimer cette caractéristique"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddInterieur}>
          + Ajouter les caractéristiques intérieures
        </button>
      </div>
      
      {/* SECTION EXTÉRIEURE */}
      <div className={styles.subSection}>
        <h3>Caractéristiques extérieure</h3>
        <div className={styles.checkboxGrid}>
          {exterieurs.map((ext, i) => (
            <div key={i} className={styles.checkboxItem}>
              <input
                type="checkbox"
                id={`exterieur_${i}`}
                checked={formData.exterieurChecked.includes(ext)}
                onChange={e => {
                  setFormData(f => {
                    const arr = [...f.exterieurChecked];
                    if (e.target.checked) arr.push(ext);
                    else arr.splice(arr.indexOf(ext), 1);
                    return { ...f, exterieurChecked: arr };
                  });
                }}
              />
              <label htmlFor={`exterieur_${i}`}>
                {icons.ext}
                {ext}
              </label>
            </div>
          ))}
        </div>
        
        {/* CHAMPS - Les nouveaux apparaissent au-dessus du bouton */}
        {formData.exterieurAutres.map((val, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.ext}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Autre caractéristique extérieure"
                value={val}
                onChange={e => handleExterieurAutresChange(i, e.target.value)}
                className={getInputClass("exterieurAutres", i)}
              />
              {getInputIcon("exterieurAutres", i)}
            </div>
            {touched[`exterieurAutres_${i}`] && errors[`exterieurAutres_${i}`] && (
              <div className={styles.errorMessage}>{errors[`exterieurAutres_${i}`]}</div>
            )}
            <button 
              type="button" 
              className={styles.deleteIcon} 
              onClick={() => handleRemoveExterieurAutres(i)}
              title="Supprimer cette caractéristique"
            >
              🗑️
            </button>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddExterieurAutres}>
          + Ajouter d'autres
        </button>
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 4 : Documents (non obligatoire)
function Step4({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    doc: <span className={styles.iconLabel}>📄</span>
  };
  
  const [canProceed, setCanProceed] = useState(true);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = (field, value, index = null) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    const fieldKey = index !== null ? `${field}_${index}` : field;
    
    if (!value) {
      newErrors[fieldKey] = "Champ requis";
      delete newValidation[fieldKey];
    } else if (value.length < 2) {
      newErrors[fieldKey] = "Min 2 caractères";
      delete newValidation[fieldKey];
    } else if (value.length > 100) {
      newErrors[fieldKey] = "Max 100 caractères";
      delete newValidation[fieldKey];
    } else if (autorisesRegex.test(value)) {
      newErrors[fieldKey] = "Caractères non autorisés";
      delete newValidation[fieldKey];
    } else {
      delete newErrors[fieldKey];
      newValidation[fieldKey] = true;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  const checkCanProceed = () => {
    // Si aucun bloc dynamique n'a été ajouté, bouton Suivant activé
    if (formData.documents.length === 0) {
      return true;
    }
    // Si au moins un bloc, il faut que tous les champs soient remplis et valides
    let valid = true;
    for (let i = 0; i < formData.documents.length; i++) {
      const nom = formData.documents[i].nom;
      if (!nom || errors[`documents_${i}`]) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, errors]);

  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  const handleAddDocument = () => {
    const idx = formData.documents.length;
    setFormData(f => ({ ...f, documents: [...f.documents, { nom: "" }] }));
    setTouched(t => ({ ...t, [`documents_${idx}`]: true }));
    setErrors(e => ({ ...e, [`documents_${idx}`]: "Champ requis" }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`documents_${idx}`];
      return nv;
    });
  };

  const handleDocumentChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.documents];
      arr[i].nom = value;
      return { ...f, documents: arr };
    });
    const fieldKey = `documents_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("documents", value, i);
  };

  const handleRemoveDocument = i => {
    setFormData(f => {
      const arr = [...f.documents];
      arr.splice(i, 1);
      return { ...f, documents: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`documents_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`documents_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`documents_${i}`];
    setFieldValidation(newValidation);
  };

  const handleNext = () => {
    // Valider tous les champs existants
    const newTouched = { ...touched };
    
    formData.documents.forEach((_, i) => {
      newTouched[`documents_${i}`] = true;
      validateField("documents", formData.documents[i].nom, i);
    });
    
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>DOCUMENTS</h1>
      <p className={styles.subSectionDescription}>
        Ajoutez les documents nécessaires pour certifier l'authenticité et la légalité de votre bien
      </p>
      
      <div className={styles.subSection}>
        <small>Cliquez sur le bouton pour ajouter les documents nécessaires</small>
        
        {formData.documents.map((doc, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.doc}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Nom du document"
                value={doc.nom}
                onChange={e => handleDocumentChange(i, e.target.value)}
                className={getInputClass("documents", i)}
              />
              {getInputIcon("documents", i)}
            </div>
            {touched[`documents_${i}`] && errors[`documents_${i}`] && <div className={styles.errorMessage}>{errors[`documents_${i}`]}</div>}
            <span className={styles.deleteIcon} onClick={() => handleRemoveDocument(i)}>🗑️</span>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddDocument}>
          + Ajouter des documents
        </button>
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 5 : Accessibilité (non obligatoire)
function Step5({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    access: <span className={styles.iconLabel}>🚗</span>
  };
  
  const [canProceed, setCanProceed] = useState(true);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = (field, value, index = null) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    const fieldKey = index !== null ? `${field}_${index}` : field;
    
    if (!value) {
      newErrors[fieldKey] = "Champ requis";
      delete newValidation[fieldKey];
    } else if (value.length < 2) {
      newErrors[fieldKey] = "Min 2 caractères";
      delete newValidation[fieldKey];
    } else if (value.length > 100) {
      newErrors[fieldKey] = "Max 100 caractères";
      delete newValidation[fieldKey];
    } else if (autorisesRegex.test(value)) {
      newErrors[fieldKey] = "Caractères non autorisés";
      delete newValidation[fieldKey];
    } else {
      delete newErrors[fieldKey];
      newValidation[fieldKey] = true;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  const checkCanProceed = () => {
    // Si aucun bloc dynamique n'a été ajouté, bouton Suivant activé
    if (formData.accessibiliteAutres.length === 0) {
      return true;
    }
    // Si au moins un bloc, il faut que tous les champs soient remplis et valides
    let valid = true;
    for (let i = 0; i < formData.accessibiliteAutres.length; i++) {
      const val = formData.accessibiliteAutres[i];
      if (!val || errors[`accessibiliteAutres_${i}`]) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, errors]);

  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  const accessibilites = [
    "Proche du goudron", "Quartier animé", "Quartier en développement", "Fibre optique", "Viabilisation"
  ];

  const handleAddAccessAutres = () => {
    const idx = formData.accessibiliteAutres.length;
    setFormData(f => ({ ...f, accessibiliteAutres: [...f.accessibiliteAutres, ""] }));
    setTouched(t => ({ ...t, [`accessibiliteAutres_${idx}`]: true }));
    setErrors(e => ({ ...e, [`accessibiliteAutres_${idx}`]: "Champ requis" }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`accessibiliteAutres_${idx}`];
      return nv;
    });
  };

  const handleAccessAutresChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.accessibiliteAutres];
      arr[i] = value;
      return { ...f, accessibiliteAutres: arr };
    });
    const fieldKey = `accessibiliteAutres_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("accessibiliteAutres", value, i);
  };

  const handleRemoveAccessAutres = i => {
    setFormData(f => {
      const arr = [...f.accessibiliteAutres];
      arr.splice(i, 1);
      return { ...f, accessibiliteAutres: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`accessibiliteAutres_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`accessibiliteAutres_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`accessibiliteAutres_${i}`];
    setFieldValidation(newValidation);
  };

  const handleNext = () => {
    // Valider tous les champs existants
    const newTouched = { ...touched };
    
    formData.accessibiliteAutres.forEach((_, i) => {
      newTouched[`accessibiliteAutres_${i}`] = true;
      validateField("accessibiliteAutres", formData.accessibiliteAutres[i], i);
    });
    
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>ACCESSIBILITÉ</h1>
      <p className={styles.subSectionDescription}>
        Décrivez l'accessibilité et l'environnement du bien pour informer sur la qualité de vie du quartier
      </p>
      
      <div className={styles.subSection}>
        <div className={styles.checkboxGrid}>
          {accessibilites.map((acc, i) => (
            <div key={i} className={styles.checkboxItem}>
              {icons.access}
              <input
                type="checkbox"
                id={`access_${i}`}
                checked={formData.accessibiliteChecked.includes(acc)}
                onChange={e => {
                  setFormData(f => {
                    const arr = [...f.accessibiliteChecked];
                    if (e.target.checked) arr.push(acc);
                    else arr.splice(arr.indexOf(acc), 1);
                    return { ...f, accessibiliteChecked: arr };
                  });
                }}
              />
              <label htmlFor={`access_${i}`}>{acc}</label>
            </div>
          ))}
        </div>
        
        {formData.accessibiliteAutres.map((val, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.access}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Autre accessibilité"
                value={val}
                onChange={e => handleAccessAutresChange(i, e.target.value)}
                className={getInputClass("accessibiliteAutres", i)}
              />
              {getInputIcon("accessibiliteAutres", i)}
            </div>
            {touched[`accessibiliteAutres_${i}`] && errors[`accessibiliteAutres_${i}`] && <div className={styles.errorMessage}>{errors[`accessibiliteAutres_${i}`]}</div>}
            <span className={styles.deleteIcon} onClick={() => handleRemoveAccessAutres(i)}>🗑️</span>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddAccessAutres}>
          + Ajouter d'autres
        </button>
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 6 : Commodités (non obligatoire)
function Step6({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    com: <span className={styles.iconLabel}>🏫</span>
  };
  
  const [canProceed, setCanProceed] = useState(true);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = (field, value, index = null) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    const fieldKey = index !== null ? `${field}_${index}` : field;
    
    if (!value) {
      newErrors[fieldKey] = "Champ requis";
      delete newValidation[fieldKey];
    } else if (value.length < 2) {
      newErrors[fieldKey] = "Min 2 caractères";
      delete newValidation[fieldKey];
    } else if (value.length > 100) {
      newErrors[fieldKey] = "Max 100 caractères";
      delete newValidation[fieldKey];
    } else if (autorisesRegex.test(value)) {
      newErrors[fieldKey] = "Caractères non autorisés";
      delete newValidation[fieldKey];
    } else {
      delete newErrors[fieldKey];
      newValidation[fieldKey] = true;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  const checkCanProceed = () => {
    // Si aucun bloc dynamique n'a été ajouté, bouton Suivant activé
    if (formData.commoditeAutres.length === 0) {
      return true;
    }
    // Si au moins un bloc, il faut que tous les champs soient remplis et valides
    let valid = true;
    for (let i = 0; i < formData.commoditeAutres.length; i++) {
      const val = formData.commoditeAutres[i];
      if (!val || errors[`commoditeAutres_${i}`]) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, errors]);

  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  const commodites = [
    "École", "Université", "Hôpitaux", "Marchés", "Supermarchés", "Transport public", "Gares routières"
  ];

  const handleAddCommoditeAutres = () => {
    const idx = formData.commoditeAutres.length;
    setFormData(f => ({ ...f, commoditeAutres: [...f.commoditeAutres, ""] }));
    setTouched(t => ({ ...t, [`commoditeAutres_${idx}`]: true }));
    setErrors(e => ({ ...e, [`commoditeAutres_${idx}`]: "Champ requis" }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`commoditeAutres_${idx}`];
      return nv;
    });
  };

  const handleCommoditeAutresChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.commoditeAutres];
      arr[i] = value;
      return { ...f, commoditeAutres: arr };
    });
    const fieldKey = `commoditeAutres_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("commoditeAutres", value, i);
  };

  const handleRemoveCommoditeAutres = i => {
    setFormData(f => {
      const arr = [...f.commoditeAutres];
      arr.splice(i, 1);
      return { ...f, commoditeAutres: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`commoditeAutres_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`commoditeAutres_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`commoditeAutres_${i}`];
    setFieldValidation(newValidation);
  };

  const handleNext = () => {
    // Valider tous les champs existants
    const newTouched = { ...touched };
    
    formData.commoditeAutres.forEach((_, i) => {
      newTouched[`commoditeAutres_${i}`] = true;
      validateField("commoditeAutres", formData.commoditeAutres[i], i);
    });
    
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>COMMODITÉS À PROXIMITÉ</h1>
      <p className={styles.subSectionDescription}>
        Indiquez les commodités disponibles près de votre bien pour valoriser son emplacement stratégique
      </p>
      
      <div className={styles.subSection}>
        <div className={styles.checkboxGrid}>
          {commodites.map((com, i) => (
            <div key={i} className={styles.checkboxItem}>
              {icons.com}
              <input
                type="checkbox"
                id={`commodite_${i}`}
                checked={formData.commoditeChecked.includes(com)}
                onChange={e => {
                  setFormData(f => {
                    const arr = [...f.commoditeChecked];
                    if (e.target.checked) arr.push(com);
                    else arr.splice(arr.indexOf(com), 1);
                    return { ...f, commoditeChecked: arr };
                  });
                }}
              />
              <label htmlFor={`commodite_${i}`}>{com}</label>
            </div>
          ))}
        </div>
        
        {formData.commoditeAutres.map((val, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.com}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Autre commodité"
                value={val}
                onChange={e => handleCommoditeAutresChange(i, e.target.value)}
                className={getInputClass("commoditeAutres", i)}
              />
              {getInputIcon("commoditeAutres", i)}
            </div>
            {touched[`commoditeAutres_${i}`] && errors[`commoditeAutres_${i}`] && <div className={styles.errorMessage}>{errors[`commoditeAutres_${i}`]}</div>}
            <span className={styles.deleteIcon} onClick={() => handleRemoveCommoditeAutres(i)}>🗑️</span>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddCommoditeAutres}>
          + Ajouter d'autres
        </button>
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 7 : Conditions de paiement & Bonus
function Step7({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, nextStep, prevStep }) {
  // Icônes
  const icons = {
    paiement: <span className={styles.iconLabel}>💳</span>,
    bonus: <span className={styles.iconLabel}>🎁</span>
  };
  
  const [canProceed, setCanProceed] = useState(true);
  const [touched, setTouched] = useState({});

  // Validation en temps réel
  const validateField = (field, value, index = null) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };
    const fieldKey = index !== null ? `${field}_${index}` : field;
    
    if (!value) {
      newErrors[fieldKey] = "Champ requis";
      delete newValidation[fieldKey];
    } else if (value.length < 2) {
      newErrors[fieldKey] = "Min 2 caractères";
      delete newValidation[fieldKey];
    } else if (value.length > (field === "conditionsPaiement" ? 200 : 100)) {
      newErrors[fieldKey] = field === "conditionsPaiement" ? "Max 200 caractères" : "Max 100 caractères";
      delete newValidation[fieldKey];
    } else if (autorisesRegex.test(value)) {
      newErrors[fieldKey] = "Caractères non autorisés";
      delete newValidation[fieldKey];
    } else {
      delete newErrors[fieldKey];
      newValidation[fieldKey] = true;
    }
    
    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  const checkCanProceed = () => {
    // Si aucun bloc dynamique n'a été ajouté, bouton Suivant activé
    if (formData.conditionsPaiement.length === 0 && formData.bonus.length === 0) {
      return true;
    }
    // Si au moins un bloc, il faut que tous les champs soient remplis et valides
    let valid = true;
    for (let i = 0; i < formData.conditionsPaiement.length; i++) {
      const val = formData.conditionsPaiement[i];
      if (!val || errors[`conditionsPaiement_${i}`]) {
        valid = false;
        break;
      }
    }
    for (let i = 0; i < formData.bonus.length; i++) {
      const val = formData.bonus[i];
      if (!val || errors[`bonus_${i}`]) {
        valid = false;
        break;
      }
    }
    return valid;
  };

  useEffect(() => {
    setCanProceed(checkCanProceed());
  }, [formData, errors]);

  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  const handleAddPaiement = () => {
    const idx = formData.conditionsPaiement.length;
    setFormData(f => ({ ...f, conditionsPaiement: [...f.conditionsPaiement, ""] }));
    setTouched(t => ({ ...t, [`conditionsPaiement_${idx}`]: true }));
    setErrors(e => ({ ...e, [`conditionsPaiement_${idx}`]: "Champ requis" }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`conditionsPaiement_${idx}`];
      return nv;
    });
  };

  const handlePaiementChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.conditionsPaiement];
      arr[i] = value;
      return { ...f, conditionsPaiement: arr };
    });
    const fieldKey = `conditionsPaiement_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("conditionsPaiement", value, i);
  };

  const handleRemovePaiement = i => {
    setFormData(f => {
      const arr = [...f.conditionsPaiement];
      arr.splice(i, 1);
      return { ...f, conditionsPaiement: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`conditionsPaiement_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`conditionsPaiement_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`conditionsPaiement_${i}`];
    setFieldValidation(newValidation);
  };

  const handleAddBonus = () => {
    const idx = formData.bonus.length;
    setFormData(f => ({ ...f, bonus: [...f.bonus, ""] }));
    setTouched(t => ({ ...t, [`bonus_${idx}`]: true }));
    setErrors(e => ({ ...e, [`bonus_${idx}`]: "Champ requis" }));
    setFieldValidation(fv => {
      const nv = { ...fv };
      delete nv[`bonus_${idx}`];
      return nv;
    });
  };

  const handleBonusChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.bonus];
      arr[i] = value;
      return { ...f, bonus: arr };
    });
    const fieldKey = `bonus_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    validateField("bonus", value, i);
  };

  const handleRemoveBonus = i => {
    setFormData(f => {
      const arr = [...f.bonus];
      arr.splice(i, 1);
      return { ...f, bonus: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`bonus_${i}`];
      return newTouched;
    });
    // Supprimer les erreurs associées
    const newErrors = { ...errors };
    delete newErrors[`bonus_${i}`];
    setErrors(newErrors);
    // Supprimer la validation
    const newValidation = { ...fieldValidation };
    delete newValidation[`bonus_${i}`];
    setFieldValidation(newValidation);
  };

  const handleNext = () => {
    // Valider tous les champs existants
    const newTouched = { ...touched };
    
    formData.conditionsPaiement.forEach((_, i) => {
      newTouched[`conditionsPaiement_${i}`] = true;
      validateField("conditionsPaiement", formData.conditionsPaiement[i], i);
    });
    
    formData.bonus.forEach((_, i) => {
      newTouched[`bonus_${i}`] = true;
      validateField("bonus", formData.bonus[i], i);
    });
    
    setTouched(newTouched);
    
    if (checkCanProceed()) nextStep();
  };

  return (
    <section className={styles.step}>
      <h1>CONDITION DE PAIE & BONUS</h1>
      <p className={styles.subSectionDescription}>
        Définissez les conditions financières et les avantages pour rendre votre offre plus attractive
      </p>
      
      <div className={styles.subSection}>
        <h3>Condition de paie</h3>
        <small>Cliquez sur le bouton à chaque fois pour ajouter vos conditions de paiement</small>
        
        {formData.conditionsPaiement.map((val, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.paiement}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Condition de paiement"
                value={val}
                onChange={e => handlePaiementChange(i, e.target.value)}
                className={getInputClass("conditionsPaiement", i)}
              />
              {getInputIcon("conditionsPaiement", i)}
            </div>
            {touched[`conditionsPaiement_${i}`] && errors[`conditionsPaiement_${i}`] && <div className={styles.errorMessage}>{errors[`conditionsPaiement_${i}`]}</div>}
            <span className={styles.deleteIcon} onClick={() => handleRemovePaiement(i)}>🗑️</span>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddPaiement}>
          + Ajouter une condition de paiement
        </button>
      </div>
      
      <div className={styles.subSection}>
        <h3>Bonus (facultatif)</h3>
        <small>Cliquez sur le bouton à chaque fois pour ajouter vos bonus ou une promotion sur le bien</small>
        
        {formData.bonus.map((val, i) => (
          <div key={i} className={styles.dynamicBlock}>
            {icons.bonus}
            <div className={styles.inputWrapper}>
              <input
                type="text"
                placeholder="Bonus ou promotion"
                value={val}
                onChange={e => handleBonusChange(i, e.target.value)}
                className={getInputClass("bonus", i)}
              />
              {getInputIcon("bonus", i)}
            </div>
            {touched[`bonus_${i}`] && errors[`bonus_${i}`] && <div className={styles.errorMessage}>{errors[`bonus_${i}`]}</div>}
            <span className={styles.deleteIcon} onClick={() => handleRemoveBonus(i)}>🗑️</span>
          </div>
        ))}
        
        {/* BOUTON EN BAS */}
        <button type="button" className={styles.btnAdd} onClick={handleAddBonus}>
          + Ajouter un bonus
        </button>
      </div>
      
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button type="button" className={styles.btnNext} onClick={handleNext} disabled={!canProceed}>
          Suivant
        </button>
      </div>
    </section>
  );
}

// Étape 8 : Photos & Vidéos - CORRIGÉ
function Step8({ formData, setFormData, errors, setErrors, fieldValidation, setFieldValidation, prevStep, clearLocalStorage }) {
  // Icônes
  const icons = {
    photo: <span className={styles.iconLabel}>🖼️</span>,
    piece: <span className={styles.iconLabel}>🚪</span>,
    video: <span className={styles.iconLabel}>🎬</span>,
  };
  
  const [canProceed, setCanProceed] = useState(false);
  const [touched, setTouched] = useState({});
  const [showRecap, setShowRecap] = useState(false);
  const [totalPhotos, setTotalPhotos] = useState(0);
  const [pieceValidation, setPieceValidation] = useState({});

  // Calcul du total des photos
  useEffect(() => {
    const total = formData.pieces.reduce((sum, piece) => sum + (piece.photos ? piece.photos.length : 0), 0);
    setTotalPhotos(total);
  }, [formData.pieces]);

  // Validation améliorée
  useEffect(() => {
    const newErrors = {};
    const newValidation = {};
    const newPieceValidation = {};

    // Photo principale - OBLIGATOIRE
    if (!formData.photoPrincipale) {
      newErrors.photoPrincipale = "Photo principale requise";
    } else {
      newValidation.photoPrincipale = true;
    }

    // Pièces - OBLIGATOIRE (au moins une pièce)
    if (formData.pieces.length === 0) {
      newErrors.pieces = "Ajoutez au moins une pièce";
    } else {
      newValidation.pieces = true;
      
      // Validation de chaque pièce
      formData.pieces.forEach((piece, i) => {
        const pieceKey = `piece_${i}`;
        
        // Nom de pièce obligatoire
        if (!piece.name || piece.name.trim() === '') {
          newErrors[`pieceName_${i}`] = "Nom de pièce requis";
          newPieceValidation[pieceKey] = false;
        } else if (piece.name.length < 2) {
          newErrors[`pieceName_${i}`] = "Le nom doit contenir au moins 2 caractères";
          newPieceValidation[pieceKey] = false;
        } else if (piece.name.length > 50) {
          newErrors[`pieceName_${i}`] = "Le nom ne doit pas dépasser 50 caractères";
          newPieceValidation[pieceKey] = false;
        } else if (autorisesRegex.test(piece.name)) {
          newErrors[`pieceName_${i}`] = "Caractères non autorisés";
          newPieceValidation[pieceKey] = false;
        } else {
          newValidation[`pieceName_${i}`] = true;
        }

        // Photos - Au moins une photo par pièce obligatoire
        if (!piece.photos || piece.photos.length === 0) {
          // On marque l'erreur seulement si l'utilisateur a déjà essayé d'ajouter des photos
          if (touched[`piecePhotos_${i}`]) {
            newErrors[`piecePhotos_${i}`] = "Au moins une photo requise pour cette pièce";
            newPieceValidation[pieceKey] = false;
          }
        } else {
          newValidation[`piecePhotos_${i}`] = true;
          if (newValidation[`pieceName_${i}`]) {
            newPieceValidation[pieceKey] = true;
          }
        }
      });
    }

    // Total photos (100 max pour toutes les pièces)
    if (totalPhotos > 100) {
      newErrors.totalPhotos = `Maximum 100 photos autorisées (actuellement: ${totalPhotos})`;
    } else {
      newValidation.totalPhotos = true;
    }

    // Vidéo - FACULTATIVE
    if (formData.video.platform && !formData.video.url) {
      newErrors.videoUrl = "URL vidéo requise lorsque la plateforme est sélectionnée";
    } else if (formData.video.url && !formData.video.platform) {
      newErrors.videoPlatform = "Plateforme requise lorsque l'URL est renseignée";
    } else if (formData.video.url && formData.video.url.length < 10) {
      newErrors.videoUrl = "URL vidéo trop courte";
    } else {
      if (formData.video.platform) newValidation.videoPlatform = true;
      if (formData.video.url && formData.video.url.length >= 10) newValidation.videoUrl = true;
    }

    setErrors(newErrors);
    setFieldValidation(newValidation);
    setPieceValidation(newPieceValidation);

    // Vérifier si on peut procéder
    const hasCriticalErrors = 
      newErrors.photoPrincipale || 
      newErrors.pieces ||
      Object.keys(newPieceValidation).some(key => newPieceValidation[key] === false) ||
      newErrors.totalPhotos;
    
    setCanProceed(!hasCriticalErrors);
  }, [formData, totalPhotos, touched]);

  // Style dynamique pour input
  const getInputClass = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return styles.valid;
    if (touched[fieldKey] && errors[fieldKey]) return styles.invalid;
    return "";
  };

  // Icône de validation dans le champ
  const getInputIcon = (field, index = null) => {
    const fieldKey = index !== null ? `${field}_${index}` : field;
    if (fieldValidation[fieldKey]) return <span className={styles.iconValid}>✔️</span>;
    if (touched[fieldKey] && errors[fieldKey]) return <span className={styles.iconError}>❌</span>;
    return null;
  };

  // Gestion des photos de pièces
  const handlePiecePhotoChange = (i, files) => {
    const newPhotos = Array.from(files);
    
    setFormData(f => {
      const arr = [...f.pieces];
      const currentPhotos = arr[i]?.photos || [];
      
      // Éviter les doublons
      const filteredNewPhotos = newPhotos.filter(newPhoto => 
        !currentPhotos.some(existingPhoto => 
          existingPhoto.name === newPhoto.name && 
          existingPhoto.size === newPhoto.size
        )
      );
      
      if (filteredNewPhotos.length === 0) return f;
      
      // Calculer le nouveau total
      const currentPiecePhotos = currentPhotos.length;
      const otherPhotos = totalPhotos - currentPiecePhotos;
      const newTotal = otherPhotos + filteredNewPhotos.length;
      
      if (newTotal > 100) {
        const allowedPhotos = 100 - otherPhotos;
        if (allowedPhotos > 0) {
          const limitedPhotos = filteredNewPhotos.slice(0, allowedPhotos);
          arr[i].photos = [...currentPhotos, ...limitedPhotos];
        }
      } else {
        arr[i].photos = [...currentPhotos, ...filteredNewPhotos];
      }
      
      return { ...f, pieces: arr };
    });
    
    // Marquer comme touché pour la validation - MAIS seulement après l'ajout
    const fieldKey = `piecePhotos_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
    
    // Réinitialiser l'input file
    const fileInput = document.querySelector(`input[type="file"][data-piece-index="${i}"]`);
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handlers
  const handlePhotoPrincipale = e => {
    const file = e.target.files[0];
    if (file) {
      setFormData(f => ({ ...f, photoPrincipale: file }));
      setTouched(t => ({ ...t, photoPrincipale: true }));
    }
    e.target.value = '';
  };

  const handleAddPiece = () => {
    setFormData(f => ({ 
      ...f, 
      pieces: [...f.pieces, { name: "", photos: [] }] 
    }));
  };

  const handlePieceChange = (i, value) => {
    setFormData(f => {
      const arr = [...f.pieces];
      arr[i].name = value;
      return { ...f, pieces: arr };
    });
    const fieldKey = `pieceName_${i}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
  };

  const handleRemovePiece = i => {
    setFormData(f => {
      const arr = [...f.pieces];
      arr.splice(i, 1);
      return { ...f, pieces: arr };
    });
    setTouched(t => {
      const newTouched = { ...t };
      delete newTouched[`pieceName_${i}`];
      delete newTouched[`piecePhotos_${i}`];
      return newTouched;
    });
  };

  const handleVideoChange = (field, value) => {
    setFormData(f => ({ 
      ...f, 
      video: { ...f.video, [field]: value } 
    }));
    const fieldKey = `video${field.charAt(0).toUpperCase() + field.slice(1)}`;
    setTouched(t => ({ ...t, [fieldKey]: true }));
  };

  // Aperçu vidéo
  const getVideoPreview = () => {
    if (!formData.video.url) return null;
    
    let src = formData.video.url;
    if (formData.video.platform === "youtube") {
      const match = src.match(/(?:v=|youtu\.be\/)([\w-]+)/);
      if (match) src = `https://www.youtube.com/embed/${match[1]}`;
    } else if (formData.video.platform === "vimeo") {
      const match = src.match(/vimeo\.com\/(\d+)/);
      if (match) src = `https://player.vimeo.com/video/${match[1]}`;
    }
    
    return (
      <div className={styles.videoPreviewContainer}>
        <iframe 
          src={src} 
          frameBorder="0" 
          allowFullScreen 
          title="Aperçu vidéo" 
        />
      </div>
    );
  };

  // Aperçu photo principale
  const getPhotoPrincipalePreview = () => {
    if (!formData.photoPrincipale) return null;
    
    try {
      const url = URL.createObjectURL(formData.photoPrincipale);
      return (
        <div className={styles.previewContainer}>
          <img src={url} alt="Photo principale" className={styles.previewImage} />
          <button 
            type="button" 
            className={styles.deleteIcon} 
            onClick={() => setFormData(f => ({ ...f, photoPrincipale: null }))}
          >
            🗑️
          </button>
        </div>
      );
    } catch (error) {
      console.error("Erreur création URL:", error);
      return null;
    }
  };

  // Aperçu photos des pièces
  const getPiecePhotosPreview = (piece, pieceIndex) => {
    if (!piece.photos || piece.photos.length === 0) return null;
    
    return (
      <div className={styles.photosPreview}>
        {piece.photos.map((file, idx) => {
          try {
            const url = URL.createObjectURL(file);
            return (
              <div key={idx} className={styles.photoItem}>
                <img src={url} alt={`Photo ${idx + 1}`} className={styles.previewImage} />
                <button 
                  type="button" 
                  className={styles.deleteIcon}
                  onClick={() => {
                    setFormData(f => {
                      const arr = [...f.pieces];
                      arr[pieceIndex].photos.splice(idx, 1);
                      return { ...f, pieces: arr };
                    });
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          } catch (error) {
            console.error("Erreur création URL:", error);
            return null;
          }
        })}
      </div>
    );
  };

  // Compteur de photos par pièce
  const getPiecePhotoCounter = (piece, index) => (
    <div className={styles.piecePhotosCount}>
      {piece.photos ? piece.photos.length : 0} photo(s) pour cette pièce
      {touched[`piecePhotos_${index}`] && errors[`piecePhotos_${index}`] && (
        <div className={styles.errorMessage}>{errors[`piecePhotos_${index}`]}</div>
      )}
    </div>
  );

  // Soumission finale
  const handleSubmit = () => {
    // Marquer tous les champs comme touchés pour afficher toutes les erreurs
    const newTouched = { ...touched };
    
    newTouched.photoPrincipale = true;
    newTouched.videoPlatform = true;
    newTouched.videoUrl = true;
    
    formData.pieces.forEach((_, i) => {
      newTouched[`pieceName_${i}`] = true;
      newTouched[`piecePhotos_${i}`] = true; // Forcer la validation des photos
    });
    
    setTouched(newTouched);
    
    if (canProceed) {
      setShowRecap(true);
    }
  };

  // Envoi via axios
  const handleConfirmPublish = async () => {
    const form = new FormData();
    // Champs simples
    form.append('id_utilisateur', formData.id_utilisateur || '');
    form.append('typeBien', formData.typeBien || '');
    form.append('typeOffre', formData.typeOffre || '');
    form.append('statut', formData.statut || '');
    form.append('meuble', formData.meuble || '');
    form.append('disponibilite', formData.disponibilite || '');
    form.append('surface', formData.surface || '');
    form.append('fraisVisite', formData.fraisVisite || '');
    form.append('prixVisite', formData.prixVisite || '');
    form.append('titreAnnonce', formData.titreAnnonce || '');
    form.append('descriptionBien', formData.descriptionBien || '');
    form.append('ville', formData.ville || '');
    form.append('commune', formData.commune || '');
    form.append('quartier', formData.quartier || '');
    form.append('latitude', formData.latitude || '');
    form.append('longitude', formData.longitude || '');

    // Photo principale
    if (formData.photoPrincipale) {
      form.append('photo_principale', formData.photoPrincipale); // nom aligné avec l'API PHP
    }

    // Caractéristiques intérieures
    form.append('interieur', JSON.stringify(formData.interieur || []));
    // Caractéristiques extérieures
    form.append('exterieurChecked', JSON.stringify(formData.exterieurChecked || []));
    form.append('exterieurAutres', JSON.stringify(formData.exterieurAutres || []));
    // Accessibilité
    form.append('accessibiliteChecked', JSON.stringify(formData.accessibiliteChecked || []));
    form.append('accessibiliteAutres', JSON.stringify(formData.accessibiliteAutres || []));
    // Commodités
    form.append('commoditeChecked', JSON.stringify(formData.commoditeChecked || []));
    form.append('commoditeAutres', JSON.stringify(formData.commoditeAutres || []));
    // Documents
    form.append('documents', JSON.stringify(formData.documents || []));
    // Conditions de paiement & bonus
    form.append('conditionsPaiement', JSON.stringify(formData.conditionsPaiement || []));
    form.append('bonus', JSON.stringify(formData.bonus || []));
    // Pièces et photos des pièces
    form.append('pieces', JSON.stringify(formData.pieces.map(piece => ({ name: piece.name }))));
    formData.pieces.forEach((piece, i) => {
      if (piece.photos && piece.photos.length > 0) {
        for (let j = 0; j < piece.photos.length; j++) {
          form.append(`piece_photos_${i}[]`, piece.photos[j]); // nom aligné avec l'API PHP, sans crochets
        }
      }
    });
    // Vidéo
    form.append('video', JSON.stringify(formData.video || {}));

    try {
      const res = await axios.post(
        'http://localhost/plateforme_immobiliere/public/api_dashboard_users/publieAnnonces.php',
        form,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );
      if (res.data.success) {
        clearLocalStorage();
        window.location.href = '/success-page';
      } else {
        alert(res.data.message || 'Erreur lors de la publication.');
      }
    } catch (err) {
      alert('Erreur lors de la publication.');
      console.error(err);
    }
  };

  return (
    <section className={styles.step}>
      <h1>PHOTOS & VIDÉOS</h1>
      <p className={styles.subSectionDescription}>
        Ajoutez des visuels attractifs pour votre annonce - une image vaut mille mots.
      </p>
      
      {/* Photo principale */}
      <div className={styles.subSection}>
        <h3>Photo principale</h3>
        <p className={styles.fieldDescription}>
          Cette photo sera la première image visible et déterminera l'attractivité de votre annonce.
        </p>
        
        <div className={styles.uploadZone}>
          <label htmlFor="photoPrincipale" className={styles.uploadLabel}>
            <span className={styles.uploadIcon}>📷</span>
            <span>Créer une photo</span>
          </label>
          <input 
            type="file" 
            id="photoPrincipale"
            accept="image/*" 
            onChange={handlePhotoPrincipale} 
            className={styles.hiddenFileInput}
          />
        </div>
        
        {getPhotoPrincipalePreview()}
        {touched.photoPrincipale && errors.photoPrincipale && (
          <div className={styles.errorMessage}>{errors.photoPrincipale}</div>
        )}
      </div>
      
      {/* Galerie de photos par pièce */}
      <div className={styles.subSection}>
        <h3>Galerie de photos par pièce</h3>
        <p className={styles.fieldDescription}>
          Ajoutez des pièces avec leurs photos correspondantes (minimum 1 pièce, maximum 100 photos au total).
        </p>
        
        <div className={styles.totalPhotosCounter}>
          Total des photos: {totalPhotos} / 100
        </div>
        {errors.totalPhotos && <div className={styles.errorMessage}>{errors.totalPhotos}</div>}
        
        <hr className={styles.separator} />
        
        {formData.pieces.map((piece, i) => (
          <div key={i} className={styles.pieceBlock}>
            <div className={styles.pieceHeader}>
              <div className={styles.pieceNameInput}>
                <label className={styles.required}>Nom de la pièce *</label>
                <div className={styles.inputWrapper}>
                  <input
                    type="text"
                    placeholder="Ex : Salon, Chambre principale, Galerie..."
                    value={piece.name}
                    onChange={e => handlePieceChange(i, e.target.value)}
                    className={getInputClass("pieceName", i)}
                  />
                  {getInputIcon("pieceName", i)}
                </div>
                {touched[`pieceName_${i}`] && errors[`pieceName_${i}`] && (
                  <div className={styles.errorMessage}>{errors[`pieceName_${i}`]}</div>
                )}
                <small className={styles.fieldHint}>
                  Au moins une photo requise pour votre pièce.
                </small>
              </div>
              
              <button 
                type="button" 
                className={styles.deletePieceBtn} 
                onClick={() => handleRemovePiece(i)}
              >
                🗑️ Supprimer
              </button>
            </div>
            
            <div className={styles.piecePhotosSection}>
              <div className={styles.photosUploadZone}>
                <label htmlFor={`piecePhotos_${i}`} className={styles.uploadLabel}>
                  <span className={styles.uploadIcon}>🖼️</span>
                  <span>Ajouter des photos pour cette pièce</span>
                </label>
                <input
                  type="file"
                  id={`piecePhotos_${i}`}
                  accept="image/*"
                  multiple
                  data-piece-index={i}
                  onChange={e => handlePiecePhotoChange(i, e.target.files)}
                  className={styles.hiddenFileInput}
                />
              </div>
              
              {getPiecePhotoCounter(piece, i)}
              {getPiecePhotosPreview(piece, i)}
            </div>
            
            {i < formData.pieces.length - 1 && <hr className={styles.pieceSeparator} />}
          </div>
        ))}
        
        <button type="button" className={styles.btnAdd} onClick={handleAddPiece}>
          + Ajouter une pièce
        </button>
        {errors.pieces && <div className={styles.errorMessage}>{errors.pieces}</div>}
      </div>
      
      {/* Vidéo du bien */}
      <div className={styles.subSection}>
        <h3>Vidéo du bien</h3>
        
        <div className={styles.videoForm}>
          <div className={styles.formGroup}>
            <label>Plateforme vidéo</label>
            <div className={styles.inputWrapper}>
              <select
                value={formData.video.platform}
                onChange={e => handleVideoChange("platform", e.target.value)}
                className={getInputClass("videoPlatform")}
              >
                <option value="">Choisir une plateforme</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="vimeo">Vimeo</option>
              </select>
              {getInputIcon("videoPlatform")}
            </div>
            {touched.videoPlatform && errors.videoPlatform && (
              <div className={styles.errorMessage}>{errors.videoPlatform}</div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label>Lien de la vidéo</label>
            <div className={styles.inputWrapper}>
              <input
                type="url"
                placeholder="Collez le lien de votre vidéo ici..."
                value={formData.video.url}
                onChange={e => handleVideoChange("url", e.target.value)}
                className={getInputClass("videoUrl")}
              />
              {getInputIcon("videoUrl")}
            </div>
            {touched.videoUrl && errors.videoUrl && (
              <div className={styles.errorMessage}>{errors.videoUrl}</div>
            )}
          </div>
        </div>
        
        <small className={styles.fieldHint}>
          * Sélectionnez d'abord une plateforme correspondante
        </small>
        
        {getVideoPreview()}
      </div>
      
      {/* Boutons de navigation */}
      <div className={styles.navigationButtons}>
        <button type="button" className={styles.btnPrev} onClick={prevStep}>
          Précédent
        </button>
        <button 
          type="button" 
          className={styles.btnNext} 
          onClick={handleSubmit} 
          disabled={!canProceed}
        >
          Publier
        </button>
      </div>
      
      {/* Modal de récapitulatif */}
      {showRecap && (
        <div className={styles.modalOverlay}>
          <div className={styles.recapContent}>
            <h2>📝 Récapitulatif de votre annonce</h2>
            <p>Vérifiez les informations avant publication</p>
            
            <div className={styles.recapDetailsGrid}>
              {/* INFORMATIONS GÉNÉRALES */}
              <div className={styles.recapSection}>
                <h3>📋 INFORMATIONS GÉNÉRALES</h3>
                <p><strong>Type de bien :</strong> {formData.typeBien || 'Non renseigné'}</p>
                <p><strong>Type d'offre :</strong> {formData.typeOffre === 'louer' ? 'À louer' : formData.typeOffre === 'vendre' ? 'À vendre' : 'Non renseigné'}</p>
                <p><strong>Statut :</strong> {formData.statut || 'Non renseigné'}</p>
                <p><strong>Meublé :</strong> {formData.meuble === 'oui' ? 'Oui' : formData.meuble === 'non' ? 'Non' : 'Non renseigné'}</p>
                <p><strong>Disponibilité :</strong> {formData.disponibilite || 'Non renseignée'}</p>
                <p><strong>Surface :</strong> {formData.surface || 'Non renseignée'}</p>
                <p><strong>Frais de visite :</strong> {formData.fraisVisite === 'oui' ? `Oui - ${formData.prixVisite}` : formData.fraisVisite === 'non' ? 'Non' : 'Non renseigné'}</p>
                <p><strong>Titre :</strong> {formData.titreAnnonce || 'Non renseigné'}</p>
                <p><strong>Description :</strong> {formData.descriptionBien ? `${formData.descriptionBien.substring(0, 100)}...` : 'Non renseignée'}</p>
              </div>

              {/* LOCALISATION */}
              <div className={styles.recapSection}>
                <h3>📍 LOCALISATION</h3>
                <p><strong>Ville :</strong> {formData.ville || 'Non renseignée'}</p>
                <p><strong>Commune :</strong> {formData.commune || 'Non renseignée'}</p>
                <p><strong>Quartier :</strong> {formData.quartier || 'Non renseigné'}</p>
                {(formData.latitude || formData.longitude) && (
                  <p><strong>Coordonnées :</strong> {formData.latitude}, {formData.longitude}</p>
                )}
              </div>

              {/* CARACTÉRISTIQUES */}
              <div className={styles.recapSection}>
                <h3>🏠 CARACTÉRISTIQUES</h3>
                {formData.interieur.length > 0 && (
                  <div>
                    <strong>Intérieur :</strong>
                    <ul>
                      {formData.interieur.map((item, i) => (
                        <li key={i}>{item.titre} : {item.contenu}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.exterieurChecked.length > 0 && (
                  <div>
                    <strong>Extérieur :</strong>
                    <ul>
                      {formData.exterieurChecked.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.exterieurAutres.length > 0 && (
                  <div>
                    <strong>Autres extérieurs :</strong>
                    <ul>
                      {formData.exterieurAutres.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.interieur.length === 0 && formData.exterieurChecked.length === 0 && formData.exterieurAutres.length === 0 && (
                  <p>Aucune caractéristique renseignée</p>
                )}
              </div>

              {/* DOCUMENTS */}
              <div className={styles.recapSection}>
                <h3>📄 DOCUMENTS</h3>
                {formData.documents.length > 0 ? (
                  <ul>
                    {formData.documents.map((doc, i) => (
                      <li key={i}>{doc.nom}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Aucun document ajouté</p>
                )}
              </div>

              {/* ACCESSIBILITÉ */}
              <div className={styles.recapSection}>
                <h3>🚗 ACCESSIBILITÉ</h3>
                {formData.accessibiliteChecked.length > 0 && (
                  <div>
                    <strong>Options :</strong>
                    <ul>
                      {formData.accessibiliteChecked.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.accessibiliteAutres.length > 0 && (
                  <div>
                    <strong>Autres :</strong>
                    <ul>
                      {formData.accessibiliteAutres.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.accessibiliteChecked.length === 0 && formData.accessibiliteAutres.length === 0 && (
                  <p>Aucune accessibilité renseignée</p>
                )}
              </div>

              {/* COMMODITÉS */}
              <div className={styles.recapSection}>
                <h3>🏫 COMMODITÉS À PROXIMITÉ</h3>
                {formData.commoditeChecked.length > 0 && (
                  <div>
                    <strong>Options :</strong>
                    <ul>
                      {formData.commoditeChecked.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.commoditeAutres.length > 0 && (
                  <div>
                    <strong>Autres :</strong>
                    <ul>
                      {formData.commoditeAutres.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.commoditeChecked.length === 0 && formData.commoditeAutres.length === 0 && (
                  <p>Aucune commodité renseignée</p>
                )}
              </div>

              {/* CONDITIONS DE PAIEMENT & BONUS */}
              <div className={styles.recapSection}>
                <h3>💳 CONDITION DE PAIE & BONUS</h3>
                {formData.conditionsPaiement.length > 0 && (
                  <div>
                    <strong>Conditions de paiement :</strong>
                    <ul>
                      {formData.conditionsPaiement.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.bonus.length > 0 && (
                  <div>
                    <strong>Bonus :</strong>
                    <ul>
                      {formData.bonus.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.conditionsPaiement.length === 0 && formData.bonus.length === 0 && (
                  <p>Aucune condition de paiement ou bonus renseigné</p>
                )}
              </div>

              {/* PHOTOS & VIDÉOS */}
              <div className={styles.recapSection}>
                <h3>🖼️ PHOTOS & VIDÉOS</h3>
                <p><strong>Photo principale :</strong> {formData.photoPrincipale ? formData.photoPrincipale.name : 'Non ajoutée'}</p>
                <p><strong>Pièces :</strong> {formData.pieces.length} pièce(s)</p>
                <p><strong>Total photos :</strong> {totalPhotos}</p>
                {formData.pieces.length > 0 && (
                  <div>
                    <strong>Détail des pièces :</strong>
                    <ul>
                      {formData.pieces.map((piece, i) => (
                        <li key={i}>{piece.name} : {piece.photos ? piece.photos.length : 0} photo(s)</li>
                      ))}
                    </ul>
                  </div>
                )}
                {formData.video.url && (
                  <p><strong>Vidéo :</strong> {formData.video.platform} - {formData.video.url}</p>
                )}
              </div>
            </div>
            
            <div className={styles.recapActions}>
              <button 
                type="button" 
                className={styles.btnPrev} 
                onClick={() => setShowRecap(false)}
              >
                Retour
              </button>
              <button 
                type="button" 
                className={styles.btnNext} 
                onClick={handleConfirmPublish}
              >
                Confirmer et publier
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}