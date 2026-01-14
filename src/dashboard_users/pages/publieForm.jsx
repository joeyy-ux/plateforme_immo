import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import ProgressHeader from "./ProgressHeader";
import styles from "./publieBien.module.css";

import Step1InformationsGenerales from "./Step1InformationsGenerales";
import Step2Localisation from "./Step2Localisation";
import Step3Caracteristiques from "./Step3Caracteristiques";
import Step4Documents from "./Step4Documents";
import Step5Accessibilite from "./Step5Accessibilite";
import Step6Commodites from "./Step6Commodites";
import Step7ConditionsBonus from "./Step7ConditionsBonus";
import Step8Medias from "./Step8Medias";
import Step9Recapitulatif from "./Step9Recapitulatif";

/* =========================
   CONSTANTES
========================= */

// Nombre total d’étapes
const TOTAL_STEPS = 9;

// Étapes à ignorer si le bien est un Terrain
const SKIPPED_STEPS_FOR_TERRAIN = [3, 4, 5];

// Clé de sauvegarde locale
const STORAGE_KEY = "publieBien_formData";

// URL backend
const API_URL =
  "http://localhost/plateforme_immo/public/api_dashboard_users/publieAnnonces.php";

const FormulaireMultiEtapes = () => {
  const navigate = useNavigate();

  /* =========================
     STATE PRINCIPAL
  ========================= */

  // Étape actuelle
  const [currentStep, setCurrentStep] = useState(1);

  // Données globales du formulaire (structure alignée avec les steps)
  const [formData, setFormData] = useState({
    informations_generales: {},
    localisation: {},
    caracteristiques: {
      interieur: [],
      exterieur: [],
      exterieur_autres: [],
    },
    documents: [],
    accessibilite: {
      liste: [],
      autres: [],
    },
    commodites: {
      liste: [],
      autres: [],
    },
    conditions_bonus: {
      conditions_paiement: [],
      bonus: [],
    },
    medias: {
      photo_principale: null, // File
      pieces: [], // [{ nom, photos: File[] }]
      video: { platform: "", url: "" },
    },
  });

  // Erreurs venant du backend (par champ)
  const [backendErrors, setBackendErrors] = useState({});

  // Chargement lors de l’envoi
  const [loading, setLoading] = useState(false);

  // Message d’erreur global
  const [error, setError] = useState(null);

  // Indique si les données viennent du localStorage
  const [isRestoredFromStorage, setIsRestoredFromStorage] =
    useState(false);

  /* =========================
     RESTAURATION LOCALSTORAGE
  ========================= */

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setFormData(parsed);
      setIsRestoredFromStorage(true);
    } catch {
      // Si le JSON est corrompu, on supprime
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* =========================
     DÉTECTION TERRAIN
  ========================= */

  const isTerrain =
    formData.informations_generales?.type_bien === "Terrain";

  /* =========================
     SAUVEGARDE LOCALE
  ========================= */

  const saveToStorage = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  };

  /* =========================
     NAVIGATION ENTRE ÉTAPES
  ========================= */

  const nextStep = () => {
    saveToStorage();

    setCurrentStep((prev) => {
      let next = prev + 1;

      // Si Terrain, on saute certaines étapes
      if (isTerrain) {
        while (SKIPPED_STEPS_FOR_TERRAIN.includes(next)) {
          next++;
        }
      }

      return Math.min(next, TOTAL_STEPS);
    });
  };

  const prevStep = () => {
    setCurrentStep((prev) => {
      let next = prev - 1;

      if (isTerrain) {
        while (SKIPPED_STEPS_FOR_TERRAIN.includes(next)) {
          next--;
        }
      }

      return Math.max(next, 1);
    });
  };

  const goToStep = (step) => {
    if (step < 1 || step > TOTAL_STEPS) return;
    if (isTerrain && SKIPPED_STEPS_FOR_TERRAIN.includes(step)) return;
    setCurrentStep(step);
  };

  /* =========================
     NETTOYAGE AVANT ENVOI
     (important pour Terrain)
  ========================= */

  const buildCleanData = () => {
    const clean = { ...formData };

    // Si Terrain, on supprime les données interdites
    if (isTerrain) {
      clean.caracteristiques = {
        interieur: [],
        exterieur: [],
        exterieur_autres: [],
      };
      clean.documents = [];
      clean.accessibilite = { liste: [], autres: [] };
      clean.commodites = { liste: [], autres: [] };
    }

    // On enlève les fichiers du JSON (ils seront envoyés à part)
    clean.medias = {
      video: formData.medias.video,
      pieces: formData.medias.pieces.map((p) => ({
        nom: p.nom,
      })),
    };

    return clean;
  };

  /* =========================
     SOUMISSION AU BACKEND
  ========================= */

  const submitAnnonce = async () => {
    saveToStorage();

    setLoading(true);
    setError(null);
    setBackendErrors({});

    // Création du FormData
    const payload = new FormData();

    // Données JSON propres
    const cleanData = buildCleanData();
    payload.append("data", JSON.stringify(cleanData));

    // Photo principale
    if (formData.medias.photo_principale instanceof File) {
      payload.append(
        "photo_principale",
        formData.medias.photo_principale
      );
    }

    // Photos des pièces — utiliser le même nom que côté PHP
    formData.medias.pieces.forEach((piece, pIndex) => {
      piece.photos.forEach((photo, i) => {
        if (photo instanceof File) {
          // Le backend attend une clé du type "pieces_<index>_photos"
          // avec plusieurs valeurs (tableau). En PHP, $_FILES['pieces_0_photos']
          // contiendra les fichiers. On ajoute donc le suffixe [] pour
          // envoyer plusieurs fichiers.
          payload.append(
            `pieces_${pIndex}_photos[]`,
            photo
          );
        }
      });
    });

    try {
      const res = await axios.post(API_URL, payload, {
        withCredentials: true,
      });

      const data = res?.data ?? {};

      // Succès
      if (data.success) {
        localStorage.removeItem(STORAGE_KEY);
        navigate("/dashboard/accueil");
        return;
      }

      // Erreurs backend
      if (data.step) goToStep(data.step);
      if (data.errors) setBackendErrors(data.errors);

      setError(data.message || "Erreur lors de la publication");
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/connexion", { replace: true });
        return;
      }
      setError("Erreur serveur ou réseau");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     RENDER DE L’ÉTAPE
  ========================= */

  const renderStep = () => {
    const props = {
      formData,
      setFormData,
      nextStep,
      prevStep,
      goToStep,
      backendErrors,
      isRestoredFromStorage,
    };

    switch (currentStep) {
      case 1:
        return <Step1InformationsGenerales {...props} />;
      case 2:
        return <Step2Localisation {...props} />;
      case 3:
        return <Step3Caracteristiques {...props} />;
      case 4:
        return <Step4Documents {...props} />;
      case 5:
        return <Step5Accessibilite {...props} />;
      case 6:
        return <Step6Commodites {...props} />;
      case 7:
        return <Step7ConditionsBonus {...props} />;
      case 8:
        return <Step8Medias {...props} />;
      case 9:
        return (
          <Step9Recapitulatif
            {...props}
            onSubmit={submitAnnonce}
            loading={loading}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  /* =========================
     RENDER FINAL
  ========================= */

  return (
    <div className={styles.formWrapper}>
      <ProgressHeader
        currentStep={currentStep}
        isTerrain={isTerrain}
      />
      <div className={styles.formContent}>
        {renderStep()}
      </div>
    </div>
  );
};

export default FormulaireMultiEtapes;
