import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
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

// Nombre total d'étapes
const TOTAL_STEPS = 9;

// Étapes à ignorer si le bien est un Terrain
const SKIPPED_STEPS_FOR_TERRAIN = [3, 4, 5];

// Clé de sauvegarde locale
const STORAGE_KEY = "modifierBien_formData";

// URL backend pour récupération
const GET_API_URL = "http://localhost/plateforme_immo/public/api_dashboard_users/getAnnonceForEdit.php";

// URL backend pour modification
const UPDATE_API_URL = "http://localhost/plateforme_immo/public/api_dashboard_users/modifierAnnonce.php";

const FormulaireModification = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // ID du bien depuis l'URL

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
      exterieur_autres: []
    },
    documents: [],
    accessibilite: {
      liste: [],
      autres: []
    },
    commodites: {
      liste: [],
      autres: []
    },
    conditions_bonus: {
      conditions_paiement: [],
      bonus: []
    },
    medias: {
      photo_principale: null,
      pieces: [],
      video: {
        platform: "",
        url: ""
      }
    }
  });

  // États de chargement et erreurs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [backendErrors, setBackendErrors] = useState({});

  /* =========================
     CHARGEMENT DES DONNÉES EXISTANTES
  ========================= */

  useEffect(() => {
    const loadExistingData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${GET_API_URL}?id=${id}`, {
          withCredentials: true
        });

        if (response.data.success) {
          setFormData(response.data.data);
        } else {
          setError(response.data.message || "Erreur lors du chargement des données");
        }
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setError("Erreur lors du chargement des données du bien");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadExistingData();
    }
  }, [id]);

  /* =========================
     GESTION DES ÉTAPES
  ========================= */

  // Détection Terrain
  const isTerrain = formData.informations_generales.type_bien === 'Terrain';

  // Étapes actives (en excluant celles ignorées pour Terrain)
  const activeSteps = isTerrain
    ? TOTAL_STEPS - SKIPPED_STEPS_FOR_TERRAIN.length
    : TOTAL_STEPS;

  // Calcul du progrès
  const progress = Math.round((currentStep / activeSteps) * 100);

  /* =========================
     NAVIGATION ENTRE ÉTAPES
  ========================= */

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      // Sauter les étapes ignorées pour Terrain
      let next = currentStep + 1;
      if (isTerrain && SKIPPED_STEPS_FOR_TERRAIN.includes(next)) {
        next++;
      }
      setCurrentStep(next);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      // Sauter les étapes ignorées pour Terrain
      let prev = currentStep - 1;
      if (isTerrain && SKIPPED_STEPS_FOR_TERRAIN.includes(prev)) {
        prev--;
      }
      setCurrentStep(prev);
    }
  };

  const goToStep = (step) => {
    // Vérifier si l'étape est autorisée
    if (isTerrain && SKIPPED_STEPS_FOR_TERRAIN.includes(step)) {
      return;
    }
    setCurrentStep(step);
  };

  /* =========================
     SOUMISSION FINALE
  ========================= */

  const handleSubmit = async () => {
    try {
      setSubmitting(true);

      // Préparer les données pour l'envoi
      const submitData = {
        id_bien: id,
        ...formData
      };

      // Créer FormData pour les fichiers
      const formDataToSend = new FormData();

      // Ajouter les données JSON
      formDataToSend.append('data', JSON.stringify(submitData));

      // Ajouter les fichiers si présents
      if (formData.medias.photo_principale instanceof File) {
        formDataToSend.append('photo_principale', formData.medias.photo_principale);
      }

      // Ajouter les photos des pièces
      formData.medias.pieces.forEach((piece, pieceIndex) => {
        if (piece.photos && piece.photos.length > 0) {
          piece.photos.forEach((photo, photoIndex) => {
            if (photo instanceof File) {
              formDataToSend.append(`pieces_${pieceIndex}_photos`, photo);
            }
          });
        }
      });

      const response = await axios.post(UPDATE_API_URL, formDataToSend, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        // Sauvegarder en sessionStorage pour message de succès
        window.sessionStorage.setItem('modification_success', 'Bien modifié avec succès !');

        setBackendErrors({});
        // Rediriger vers MesAnnonces
        navigate('/dashboard/annonces');
      } else {
        // Gérer les erreurs de validation
        if (response.data.step) {
          setCurrentStep(response.data.step);
        }
        setBackendErrors(response.data.errors || {});
        setError(response.data.message || "Erreur lors de la modification");
      }
    } catch (err) {
      console.error("Erreur soumission:", err);
      setError("Erreur lors de la modification du bien");
    } finally {
      setSubmitting(false);
    }
  };

  /* =========================
     RENDU CONDITIONNEL
  ========================= */

  if (loading) {
    return (
      <div className={styles.loading}>
        <p>Chargement des données du bien...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard/annonces')}>
          Retour à mes annonces
        </button>
      </div>
    );
  }

  /* =========================
     RENDU PRINCIPAL
  ========================= */

  return (
    <div className={styles.formulaireMultiEtapes}>
      {/* Header avec progression */}
      <ProgressHeader
        currentStep={currentStep}
        isTerrain={isTerrain}
      />

      {/* Titre */}
      <h1 className={styles.titreFormulaire}>
        Modifier le bien
      </h1>

      {/* Contenu des étapes */}
      <div className={styles.contenuEtape}>
        {currentStep === 1 && (
          <Step1InformationsGenerales
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 2 && (
          <Step2Localisation
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 3 && !isTerrain && (
          <Step3Caracteristiques
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 4 && !isTerrain && (
          <Step4Documents
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 5 && !isTerrain && (
          <Step5Accessibilite
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 6 && (
          <Step6Commodites
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 7 && (
          <Step7ConditionsBonus
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
          />
        )}

        {currentStep === 8 && (
          <Step8Medias
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
            isModification={true}
          />
        )}

        {currentStep === 9 && (
          <Step9Recapitulatif
            formData={formData}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            goToStep={goToStep}
            backendErrors={backendErrors}
            setBackendErrors={setBackendErrors}
            isRestoredFromStorage={false}
            onSubmit={handleSubmit}
            loading={submitting}
            error={error}
          />
        )}
      </div>

      {/* Message d'erreur global */}
      {error && (
        <div className={styles.messageErreur}>
          {error}
        </div>
      )}
    </div>
    );
  };

export default FormulaireModification;