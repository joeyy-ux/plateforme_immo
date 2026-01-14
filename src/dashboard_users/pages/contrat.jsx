// contrat.jsx - Page de création de contrat
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import html2pdf from "html2pdf.js";
import styles from "./contrat.module.css";
import logo from "../../assets/logo/logo_immo.jpeg";
import { 
  FaCheckCircle, 
  FaExclamationCircle,
  FaMoneyBillWave,
  FaCreditCard,
  FaCoins,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaIdCard,
  FaFileAlt,
  FaHome
} from 'react-icons/fa';

// Regex commun pour validation des caractères autorisés
const autorisesRegex = /[^a-zA-Z0-9\s.,\-'(){}àâéèêùûîïôœç]/u;
// Regex pour numéro de téléphone
const NUMERO_REGEX = /^\+225(?: ?\d{2}){0,5}$/;
// Regex pour montants
const MONTANT_REGEX = /^[0-9\s.,a-zA-Z]+$/u;

export default function Contrat() {
  const [searchParams] = useSearchParams();
  const [bien, setBien] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("edit"); // "edit" ou "conclusion"
  const [formData, setFormData] = useState({
    prixBien: "",
    typePaiement: "",
    montantVerse: "",
    datePaiement: "",
    nomProprietaire: "",
    telProprietaire: "",
    typePieceProprietaire: "",
    numeroPieceProprietaire: "",
    nomClient: "",
    telClient: "",
    typePieceClient: "",
    numeroPieceClient: "",
    nomProprietaireApprobation: "",
    nomClientApprobation: "",
    nomClientApprobation2: "",
  });

  // États pour la validation
  const [errors, setErrors] = useState({});
  const [fieldValidation, setFieldValidation] = useState({});
  const [touched, setTouched] = useState({});

  const id = searchParams.get("id");

  const API_BASE = "http://localhost/plateforme_immo/public/api_dashboard_users";

  /* =========================
     CHARGEMENT DES DONNÉES DU BIEN
  ========================= */
  useEffect(() => {
    if (!id) {
      setError("ID du bien manquant");
      setLoading(false);
      return;
    }

    axios
      .get(`${API_BASE}/contrat.php?id=${id}`, { withCredentials: true })
      .then((res) => {
        if (res?.data?.success === false) {
          const msg = (res.data.errors && (res.data.errors.global || res.data.errors.sql)) || "Erreur serveur";
          setError(msg);
        } else {
          setBien(res.data.bien);
        }
      })
      .catch((err) => {
        console.error("contrat error:", err);
        setError("Erreur lors du chargement des données du bien.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // Pré-remplir le prix du bien
  useEffect(() => {
    if (bien) {
      const prix = bien.prix_bien || "";
      setFormData(prev => ({
        ...prev,
        prixBien: prix,
      }));
      // Valider le champ pré-rempli
      if (prix) {
        validateField('prixBien', prix);
      }
    }
  }, [bien]);

  // Fonction de validation des champs
  const validateField = (field, value) => {
    const newErrors = { ...errors };
    const newValidation = { ...fieldValidation };

    switch (field) {
      case "prixBien":
        if (!value) {
          newErrors.prixBien = "Prix du bien requis";
          delete newValidation.prixBien;
        } else if (!MONTANT_REGEX.test(value) || value.length < 1 || value.length > 20) {
          newErrors.prixBien = "Prix invalide";
          delete newValidation.prixBien;
        } else {
          delete newErrors.prixBien;
          newValidation.prixBien = true;
        }
        break;

      case "typePaiement":
        const allowedTypePaiement = ["Virement", "Espèces", "Chèque", "Carte"];
        if (!value) {
          newErrors.typePaiement = "Type de paiement requis";
          delete newValidation.typePaiement;
        } else if (!allowedTypePaiement.includes(value)) {
          newErrors.typePaiement = "Type de paiement non autorisé";
          delete newValidation.typePaiement;
        } else {
          delete newErrors.typePaiement;
          newValidation.typePaiement = true;
        }
        break;

      case "montantVerse":
        if (!value) {
          newErrors.montantVerse = "Montant versé requis";
          delete newValidation.montantVerse;
        } else if (!MONTANT_REGEX.test(value) || value.length < 1 || value.length > 20) {
          newErrors.montantVerse = "Montant invalide";
          delete newValidation.montantVerse;
        } else {
          delete newErrors.montantVerse;
          newValidation.montantVerse = true;
        }
        break;

      case "datePaiement":
        if (!value) {
          newErrors.datePaiement = "Date de paiement requise";
          delete newValidation.datePaiement;
        } else {
          delete newErrors.datePaiement;
          newValidation.datePaiement = true;
        }
        break;

      case "nomProprietaire":
        if (!value) {
          newErrors.nomProprietaire = "Nom requis";
          delete newValidation.nomProprietaire;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.nomProprietaire = "Min 2, max 200 caractères";
          delete newValidation.nomProprietaire;
        } else if (autorisesRegex.test(value)) {
          newErrors.nomProprietaire = "Caractères non autorisés";
          delete newValidation.nomProprietaire;
        } else {
          delete newErrors.nomProprietaire;
          newValidation.nomProprietaire = true;
        }
        break;

      case "telProprietaire":
        if (!value) {
          newErrors.telProprietaire = "Téléphone requis";
          delete newValidation.telProprietaire;
        } else if (!NUMERO_REGEX.test(value)) {
          newErrors.telProprietaire = "Format : +225 XX XX XX XX XX";
          delete newValidation.telProprietaire;
        } else {
          delete newErrors.telProprietaire;
          newValidation.telProprietaire = true;
        }
        break;

      case "typePieceProprietaire":
        const allowedTypePiece = ["CNI", "Passeport", "Carte de séjour", "Permis de conduire"];
        if (!value) {
          newErrors.typePieceProprietaire = "Type de pièce requis";
          delete newValidation.typePieceProprietaire;
        } else if (!allowedTypePiece.includes(value)) {
          newErrors.typePieceProprietaire = "Type de pièce non autorisé";
          delete newValidation.typePieceProprietaire;
        } else {
          delete newErrors.typePieceProprietaire;
          newValidation.typePieceProprietaire = true;
        }
        break;

      case "numeroPieceProprietaire":
        if (!value) {
          newErrors.numeroPieceProprietaire = "Numéro de pièce requis";
          delete newValidation.numeroPieceProprietaire;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.numeroPieceProprietaire = "Min 2, max 200 caractères";
          delete newValidation.numeroPieceProprietaire;
        } else if (autorisesRegex.test(value)) {
          newErrors.numeroPieceProprietaire = "Caractères non autorisés";
          delete newValidation.numeroPieceProprietaire;
        } else {
          delete newErrors.numeroPieceProprietaire;
          newValidation.numeroPieceProprietaire = true;
        }
        break;

      case "nomClient":
        if (!value) {
          newErrors.nomClient = "Nom requis";
          delete newValidation.nomClient;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.nomClient = "Min 2, max 200 caractères";
          delete newValidation.nomClient;
        } else if (autorisesRegex.test(value)) {
          newErrors.nomClient = "Caractères non autorisés";
          delete newValidation.nomClient;
        } else {
          delete newErrors.nomClient;
          newValidation.nomClient = true;
        }
        break;

      case "telClient":
        if (!value) {
          newErrors.telClient = "Téléphone requis";
          delete newValidation.telClient;
        } else if (!NUMERO_REGEX.test(value)) {
          newErrors.telClient = "Format : +225 XX XX XX XX XX";
          delete newValidation.telClient;
        } else {
          delete newErrors.telClient;
          newValidation.telClient = true;
        }
        break;

      case "typePieceClient":
        if (!value) {
          newErrors.typePieceClient = "Type de pièce requis";
          delete newValidation.typePieceClient;
        } else if (!allowedTypePiece.includes(value)) {
          newErrors.typePieceClient = "Type de pièce non autorisé";
          delete newValidation.typePieceClient;
        } else {
          delete newErrors.typePieceClient;
          newValidation.typePieceClient = true;
        }
        break;

      case "numeroPieceClient":
        if (!value) {
          newErrors.numeroPieceClient = "Numéro de pièce requis";
          delete newValidation.numeroPieceClient;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.numeroPieceClient = "Min 2, max 200 caractères";
          delete newValidation.numeroPieceClient;
        } else if (autorisesRegex.test(value)) {
          newErrors.numeroPieceClient = "Caractères non autorisés";
          delete newValidation.numeroPieceClient;
        } else {
          delete newErrors.numeroPieceClient;
          newValidation.numeroPieceClient = true;
        }
        break;

      case "nomProprietaireApprobation":
        if (!value) {
          newErrors.nomProprietaireApprobation = "Nom requis";
          delete newValidation.nomProprietaireApprobation;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.nomProprietaireApprobation = "Min 2, max 200 caractères";
          delete newValidation.nomProprietaireApprobation;
        } else if (autorisesRegex.test(value)) {
          newErrors.nomProprietaireApprobation = "Caractères non autorisés";
          delete newValidation.nomProprietaireApprobation;
        } else {
          delete newErrors.nomProprietaireApprobation;
          newValidation.nomProprietaireApprobation = true;
        }
        break;

      case "nomClientApprobation":
        if (!value) {
          newErrors.nomClientApprobation = "Nom requis";
          delete newValidation.nomClientApprobation;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.nomClientApprobation = "Min 2, max 200 caractères";
          delete newValidation.nomClientApprobation;
        } else if (autorisesRegex.test(value)) {
          newErrors.nomClientApprobation = "Caractères non autorisés";
          delete newValidation.nomClientApprobation;
        } else {
          delete newErrors.nomClientApprobation;
          newValidation.nomClientApprobation = true;
        }
        break;

      case "nomClientApprobation2":
        if (!value) {
          newErrors.nomClientApprobation2 = "Nom requis";
          delete newValidation.nomClientApprobation2;
        } else if (value.length < 2 || value.length > 200) {
          newErrors.nomClientApprobation2 = "Min 2, max 200 caractères";
          delete newValidation.nomClientApprobation2;
        } else if (autorisesRegex.test(value)) {
          newErrors.nomClientApprobation2 = "Caractères non autorisés";
          delete newValidation.nomClientApprobation2;
        } else {
          delete newErrors.nomClientApprobation2;
          newValidation.nomClientApprobation2 = true;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    setFieldValidation(newValidation);
  };

  // Gestion des changements avec validation
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, value);
  };

  // Gestion du blur pour marquer comme touché
  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
    validateField(name, formData[name]);
  };

  // Fonction de validation pure (sans état)
  const isFieldValid = (field, value) => {
    if (!value) return false;

    switch (field) {
      case "prixBien":
        return MONTANT_REGEX.test(value) && value.length >= 1 && value.length <= 20;
      case "typePaiement":
        const allowedTypePaiement = ["Virement", "Espèces", "Chèque", "Carte"];
        return allowedTypePaiement.includes(value);
      case "montantVerse":
        return MONTANT_REGEX.test(value) && value.length >= 1 && value.length <= 20;
      case "datePaiement":
        return !!value;
      case "nomProprietaire":
      case "nomClient":
      case "nomProprietaireApprobation":
      case "nomClientApprobation":
      case "nomClientApprobation2":
        return value.length >= 2 && value.length <= 200 && !autorisesRegex.test(value);
      case "telProprietaire":
      case "telClient":
        return NUMERO_REGEX.test(value);
      case "typePieceProprietaire":
      case "typePieceClient":
        const allowedTypePiece = ["CNI", "Passeport", "Carte de séjour", "Permis de conduire"];
        return allowedTypePiece.includes(value);
      case "numeroPieceProprietaire":
      case "numeroPieceClient":
        return value.length >= 2 && value.length <= 200 && !autorisesRegex.test(value);
      default:
        return false;
    }
  };

  // Vérifier si tous les champs requis sont validés
  const isFormValid = () => {
    const requiredFields = [
      'prixBien', 'typePaiement', 'montantVerse', 'datePaiement',
      'nomProprietaire', 'telProprietaire', 'typePieceProprietaire', 'numeroPieceProprietaire',
      'nomClient', 'telClient', 'typePieceClient', 'numeroPieceClient',
      'nomProprietaireApprobation', 'nomClientApprobation', 'nomClientApprobation2'
    ];
    return requiredFields.every(field => {
      const value = formData[field];
      return value && isFieldValid(field, value);
    });
  };

  // Gestion spéciale pour les numéros de téléphone
  const handleNumeroChange = (field, e) => {
    let input = e.target.value.replace(/[^\d+]/g, '');

    if (input.startsWith('+225')) input = input.substring(4);
    else if (input.startsWith('225')) input = input.substring(3);

    input = input.substring(0, 10);

    let formatted = '+225';
    if (input.length > 0) formatted += ' ';
    for (let i = 0; i < input.length; i++) {
      if (i > 0 && i % 2 === 0) formatted += ' ';
      formatted += input[i];
    }

    const trimmed = formatted.trimEnd();

    setFormData(prev => ({
      ...prev,
      [field]: trimmed,
    }));
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
    validateField(field, trimmed);
  };

  // Fonctions utilitaires pour les styles
  const getInputClass = field => {
    if (fieldValidation[field]) return styles.valid;
    if (touched[field] && errors[field]) return styles.invalid;
    return "";
  };

  const getInputIcon = field => {
    if (fieldValidation[field]) return <FaCheckCircle className={styles.validIcon} />;
    if (touched[field] && errors[field]) return <FaExclamationCircle className={styles.errorIcon} />;
    return null;
  };

  /* =========================
     FONCTION EXPORT PDF (envoie au backend avant génération)
  ========================= */
  const exportPDF = async () => {
    // envoyer les données au backend
    setError('');
    setErrors({});

    const payload = Object.assign({}, formData, { id: id });
    const fd = new FormData();
    fd.append('data', JSON.stringify(payload));

    try {
      const res = await axios.post(API_BASE + '/save_contrat.php', fd, { withCredentials: true });

      const ok = res && res.data && res.data.success;
      if (ok) {
        // génération du PDF seulement si backend OK
        const element = document.getElementById('contrat-content');
        if (!element) {
          alert('Erreur: Contenu du contrat non trouvé');
          return;
        }

        const filename = 'contrat-immobilier-' + id + '.pdf';
        const opt = {
          margin: [0.1, 0.1, 0.1, 0.1],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait', compress: true },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };

        html2pdf().set(opt).from(element).save();
      } else {
        // Afficher erreurs côté serveur sous les champs
        if (res && res.data && res.data.errors) {
          setErrors(prev => (Object.assign({}, prev, res.data.errors)));
          // marquer les champs touchés pour afficher la bordure
          const newTouched = Object.assign({}, touched);
          Object.keys(res.data.errors).forEach(function(k) { newTouched[k] = true; });
          setTouched(newTouched);
        }
        if (res && res.data && res.data.message) setError(res.data.message);
        setMode('edit');
      }
    } catch (err) {
      console.error('save contrat error:', err);
      setError('Erreur serveur lors de l\'enregistrement');
      setMode('edit');
    }
  };

  /* =========================
     ÉTATS DE CHARGEMENT ET ERREUR
  ========================= */
  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!id) {
    return (
      <section className={styles.contratPage}>
        <header className={styles.header}>
          <h1 className={styles.title}>Contrat Immobilier</h1>
        </header>
        <div className={styles.message}>
          <p>Le contrat doit être créé à partir d'un bien spécifique. Veuillez sélectionner un bien dans "Mes Annonces" et cliquer sur "Effectuer un contrat".</p>
        </div>
      </section>
    );
  }

  /* =========================
     RENDU
  ========================= */
  return (
    <section className={`${styles.contratPage} ${mode === "conclusion" ? styles.conclusionMode : ""}`} id="contrat-content">
      {mode === "conclusion" ? (
        // Mode Conclusion - Affichage A4
        <div className={styles.a4Page} id="contrat-pdf">
          {/* En-tête */}
          <header className={styles.header}>
            <h1 className={styles.title}>Contrat Immobilier</h1>
            <div className={styles.logoSection}>
              <img
                src={logo}
                alt="Logo Plateforme Immobilière"
                className={styles.logo}
                loading="lazy"
              />
              <p className={styles.platformName}>Network Académie</p>
            </div>
          </header>

          {/* Texte d'attestation */}
          <div className={styles.attestationText}>
            <p>
              Ce document atteste de l'accord entre les parties pour la transaction immobilière,
              sous l'intermédiation de la plateforme Network Académie.
            </p>
          </div>

          {/* Informations générales sur le bien */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations générales sur le bien</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type de bien :</span>
                <span className={styles.value}>{bien?.type_bien || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type d'offre :</span>
                <span className={styles.value}>{bien?.type_offre || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Titre du bien :</span>
                <span className={styles.value}>{bien?.titre || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Ville :</span>
                <span className={styles.value}>{bien?.ville || ""}</span>
              </div>
              {bien?.commune && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Commune :</span>
                  <span className={styles.value}>{bien.commune}</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.label}>Quartier :</span>
                <span className={styles.value}>{bien?.quartier || ""}</span>
              </div>
            </div>
          </section>

          {/* Modalités de paiement */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Modalités de paiement</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Prix du bien :</span>
                <span className={styles.value}>{formData.prixBien || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type de paiement :</span>
                <span className={styles.value}>{formData.typePaiement || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Montant versé :</span>
                <span className={styles.value}>{formData.montantVerse || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Date de paiement :</span>
                <span className={styles.value}>{formData.datePaiement || ""}</span>
              </div>
            </div>
          </section>

          {/* Informations sur le propriétaire */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations sur le propriétaire</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Nom et prénom :</span>
                <span className={styles.value}>{formData.nomProprietaire || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Numéro de téléphone :</span>
                <span className={styles.value}>{formData.telProprietaire || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type de pièce :</span>
                <span className={styles.value}>{formData.typePieceProprietaire || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Numéro de pièce :</span>
                <span className={styles.value}>{formData.numeroPieceProprietaire || ""}</span>
              </div>
            </div>
          </section>

          {/* Informations sur le client */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Informations sur le client</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Nom et prénom :</span>
                <span className={styles.value}>{formData.nomClient || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Numéro de téléphone :</span>
                <span className={styles.value}>{formData.telClient || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Type de pièce :</span>
                <span className={styles.value}>{formData.typePieceClient || ""}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Numéro de pièce :</span>
                <span className={styles.value}>{formData.numeroPieceClient || ""}</span>
              </div>
            </div>
          </section>

          {/* Approbation */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Approbation</h2>
            <div className={styles.approbationText}>
              <p>
                Je soussigné(e) <span className={styles.highlight}>{formData.nomProprietaireApprobation || "..................."}</span>, propriétaire ou représentant légal du bien mentionné ci-dessus,
                certifie que ce bien est disponible et m’appartient légalement.
                J’atteste avoir été mis en relation avec le client
                <span className={styles.highlight}>{formData.nomClientApprobation || "................................................"}</span> par l’intermédiaire de la plateforme
                <b>Network Académie</b>.
              </p>
              <br />
              <p>
                Je soussigné(e) <span className={styles.highlight}>{formData.nomClientApprobation2 || "................................................"}</span>, déclare avoir visité le bien concerné
                et accepté les conditions convenues avec le propriétaire.
                Je reconnais avoir été mis en relation avec le propriétaire par l’intermédiaire de la plateforme
                <b>Network Académie</b>.
              </p>
              <br />
              <p>
                Les deux parties reconnaissent que ce contrat constitue une étape préalable avant la signature définitive
                et l’éventuel paiement, et qu’il atteste du rôle d’intermédiaire de la plateforme.
              </p>
            </div>
          </section>

          {/* Signatures */}
          <section className={styles.signatures}>
            <div className={styles.signatureBox}>
              <p className={styles.signatureLabel}>Signature du Propriétaire</p>
              <div className={styles.signatureLine}></div>
              <p className={styles.signatureDate}>Date: ________________</p>
            </div>
            <div className={styles.signatureBox}>
              <p className={styles.signatureLabel}>Signature du Client</p>
              <div className={styles.signatureLine}></div>
              <p className={styles.signatureDate}>Date: ________________</p>
            </div>
          </section>

          {/* Boutons d'action */}
          <div className={styles.actions}>
            <button className={styles.btnPrint} onClick={exportPDF}>
              📄 Imprimer / Exporter PDF
            </button>
            <button className={styles.btnBack} onClick={() => setMode("edit")}>
              Retour à l'édition
            </button>
          </div>
        </div>
      ) : (
        // Mode Édition - Formulaire
        <>
      {/* En-tête avec titre centré */}
      <header className={styles.header}>
        <h1 className={styles.title}>Contrat Immobilier</h1>
      </header>

      {/* Section logo et texte */}
      <div className={styles.introSection}>
        <div className={styles.logoContainer}>
          <img
            src={logo} // Ajuster le chemin du logo
            alt="Logo Plateforme Immobilière"
            className={styles.logo}
          />
        </div>
        <div className={styles.textContainer}>
          <p className={styles.introText}>
            Bienvenue dans la section de création de contrat. Ici, vous pouvez générer un contrat officiel
            pour votre bien immobilier en remplissant les informations nécessaires.
          </p>
        </div>
      </div>

      {/* Trait horizontal */}
      <hr className={styles.separator} />

      {/* Section Informations générales sur le bien */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Informations générales sur le bien</h2>
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaHome className={styles.labelIcon} />
              Type de bien
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={bien.type_bien || ""}
                readOnly
                className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
              />
              <FaCheckCircle className={styles.validIcon} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaCreditCard className={styles.labelIcon} />
              Type d'offre
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={bien.type_offre || ""}
                readOnly
                className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
              />
              <FaCheckCircle className={styles.validIcon} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaFileAlt className={styles.labelIcon} />
              Titre du bien
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={bien.titre || ""}
                readOnly
                className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
              />
              <FaCheckCircle className={styles.validIcon} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaHome className={styles.labelIcon} />
              Ville
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={bien.ville || ""}
                readOnly
                className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
              />
              <FaCheckCircle className={styles.validIcon} />
            </div>
          </div>
          {bien.commune && (
            <div className={styles.formGroup}>
              <label className={styles.label}>
                <FaHome className={styles.labelIcon} />
                Commune
              </label>
              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={bien.commune}
                  readOnly
                  className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
                />
                <FaCheckCircle className={styles.validIcon} />
              </div>
            </div>
          )}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaHome className={styles.labelIcon} />
              Quartier
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                value={bien.quartier || ""}
                readOnly
                className={`${styles.input} ${styles.readOnly} ${styles.valid}`}
              />
              <FaCheckCircle className={styles.validIcon} />
            </div>
          </div>
        </div>
      </div>

      {/* Section Modalités de paiement */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Modalités de paiement</h2>
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaMoneyBillWave className={styles.labelIcon} />
              Prix du bien
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="prixBien"
                value={formData.prixBien}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("prixBien")}`}
                placeholder="Prix du bien"
              />
              {getInputIcon("prixBien")}
            </div>
            {touched.prixBien && errors.prixBien && <p className={styles.errorText}>{errors.prixBien}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaCreditCard className={styles.labelIcon} />
              Type de paiement
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <select
                name="typePaiement"
                value={formData.typePaiement}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("typePaiement")}`}
              >
                <option value="">Sélectionnez un type</option>
                <option value="Virement">Virement bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Carte">Carte bancaire</option>
              </select>
              {getInputIcon("typePaiement")}
            </div>
            {touched.typePaiement && errors.typePaiement && <p className={styles.errorText}>{errors.typePaiement}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaCoins className={styles.labelIcon} />
              Montant versé
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="montantVerse"
                value={formData.montantVerse}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("montantVerse")}`}
                placeholder="Montant versé"
              />
              {getInputIcon("montantVerse")}
            </div>
            {touched.montantVerse && errors.montantVerse && <p className={styles.errorText}>{errors.montantVerse}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaCalendarAlt className={styles.labelIcon} />
              Date de paiement
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="date"
                name="datePaiement"
                value={formData.datePaiement}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("datePaiement")}`}
              />
              {getInputIcon("datePaiement")}
            </div>
            {touched.datePaiement && errors.datePaiement && <p className={styles.errorText}>{errors.datePaiement}</p>}
          </div>
        </div>
      </div>

      {/* Section Informations sur le propriétaire */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Informations sur le propriétaire</h2>
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaUser className={styles.labelIcon} />
              Nom et prénom
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="nomProprietaire"
                value={formData.nomProprietaire}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("nomProprietaire")}`}
                placeholder="Nom et prénom du propriétaire"
              />
              {getInputIcon("nomProprietaire")}
            </div>
            {touched.nomProprietaire && errors.nomProprietaire && <p className={styles.errorText}>{errors.nomProprietaire}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaPhone className={styles.labelIcon} />
              Numéro de téléphone
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="tel"
                name="telProprietaire"
                value={formData.telProprietaire}
                onChange={(e) => handleNumeroChange("telProprietaire", e)}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("telProprietaire")}`}
                placeholder="+225 XX XX XX XX XX"
              />
              {getInputIcon("telProprietaire")}
            </div>
            {touched.telProprietaire && errors.telProprietaire && <p className={styles.errorText}>{errors.telProprietaire}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaIdCard className={styles.labelIcon} />
              Type de pièce
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <select
                name="typePieceProprietaire"
                value={formData.typePieceProprietaire}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("typePieceProprietaire")}`}
              >
                <option value="">Sélectionnez un type</option>
                <option value="CNI">Carte Nationale d'Identité</option>
                <option value="Passeport">Passeport</option>
                <option value="Carte de séjour">Carte de séjour</option>
                <option value="Permis de conduire">Permis de conduire</option>
              </select>
              {getInputIcon("typePieceProprietaire")}
            </div>
            {touched.typePieceProprietaire && errors.typePieceProprietaire && <p className={styles.errorText}>{errors.typePieceProprietaire}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaFileAlt className={styles.labelIcon} />
              Numéro de pièce
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="numeroPieceProprietaire"
                value={formData.numeroPieceProprietaire}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("numeroPieceProprietaire")}`}
                placeholder="Numéro de la pièce"
              />
              {getInputIcon("numeroPieceProprietaire")}
            </div>
            {touched.numeroPieceProprietaire && errors.numeroPieceProprietaire && <p className={styles.errorText}>{errors.numeroPieceProprietaire}</p>}
          </div>
        </div>
      </div>

      {/* Section Informations sur le client */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Informations sur le client</h2>
        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaUser className={styles.labelIcon} />
              Nom et prénom
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="nomClient"
                value={formData.nomClient}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("nomClient")}`}
                placeholder="Nom et prénom du client"
              />
              {getInputIcon("nomClient")}
            </div>
            {touched.nomClient && errors.nomClient && <p className={styles.errorText}>{errors.nomClient}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaPhone className={styles.labelIcon} />
              Numéro de téléphone
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="tel"
                name="telClient"
                value={formData.telClient}
                onChange={(e) => handleNumeroChange("telClient", e)}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("telClient")}`}
                placeholder="+225 XX XX XX XX XX"
              />
              {getInputIcon("telClient")}
            </div>
            {touched.telClient && errors.telClient && <p className={styles.errorText}>{errors.telClient}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaIdCard className={styles.labelIcon} />
              Type de pièce
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <select
                name="typePieceClient"
                value={formData.typePieceClient}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("typePieceClient")}`}
              >
                <option value="">Sélectionnez un type</option>
                <option value="CNI">Carte Nationale d'Identité</option>
                <option value="Passeport">Passeport</option>
                <option value="Carte de séjour">Carte de séjour</option>
                <option value="Permis de conduire">Permis de conduire</option>
              </select>
              {getInputIcon("typePieceClient")}
            </div>
            {touched.typePieceClient && errors.typePieceClient && <p className={styles.errorText}>{errors.typePieceClient}</p>}
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>
              <FaFileAlt className={styles.labelIcon} />
              Numéro de pièce
              <span className={styles.required}>*</span>
            </label>
            <div className={styles.inputWrapper}>
              <input
                type="text"
                name="numeroPieceClient"
                value={formData.numeroPieceClient}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${styles.input} ${getInputClass("numeroPieceClient")}`}
                placeholder="Numéro de la pièce"
              />
              {getInputIcon("numeroPieceClient")}
            </div>
            {touched.numeroPieceClient && errors.numeroPieceClient && <p className={styles.errorText}>{errors.numeroPieceClient}</p>}
          </div>
        </div>
      </div>

      {/* Section Approbation */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Approbation</h2>
        <div className={styles.approbationText}>
          <p>
            Je soussigné(e) <input type="text" name="nomProprietaireApprobation" value={formData.nomProprietaireApprobation} onChange={handleChange} onBlur={handleBlur} className={`${styles.dottedInput} ${getInputClass("nomProprietaireApprobation")}`} placeholder="..................." /> propriétaire ou représentant légal du bien mentionné ci-dessus,
            certifie que ce bien est disponible et m'appartient légalement.
            J'atteste avoir été mis en relation avec le client
            <input type="text" name="nomClientApprobation" value={formData.nomClientApprobation} onChange={handleChange} onBlur={handleBlur} className={`${styles.dottedInput} ${getInputClass("nomClientApprobation")}`} placeholder="................................................" /> par l'intermédiaire de la plateforme
            <b>Network Académie</b>.
          </p>
          <br />
          <p>
            Je soussigné(e) <input type="text" name="nomClientApprobation2" value={formData.nomClientApprobation2} onChange={handleChange} onBlur={handleBlur} className={`${styles.dottedInput} ${getInputClass("nomClientApprobation2")}`} placeholder="................................................" /> déclare avoir visité le bien concerné
            et accepté les conditions convenues avec le propriétaire.
            Je reconnais avoir été mis en relation avec le propriétaire par l'intermédiaire de la plateforme
            <b>Network Académie</b>.
          </p>
          <br />
          <p>
            Les deux parties reconnaissent que ce contrat constitue une étape préalable avant la signature définitive
            et l'éventuel paiement, et qu'il atteste du rôle d'intermédiaire de la plateforme.
          </p>
        </div>
        {/* Affichage des erreurs pour la section approbation */}
        {(touched.nomProprietaireApprobation && errors.nomProprietaireApprobation) ||
         (touched.nomClientApprobation && errors.nomClientApprobation) ||
         (touched.nomClientApprobation2 && errors.nomClientApprobation2) ? (
          <div className={styles.approbationErrors}>
            {touched.nomProprietaireApprobation && errors.nomProprietaireApprobation && (
              <div className={styles.approvalErrorMessage}>Propriétaire: {errors.nomProprietaireApprobation}</div>
            )}
            {touched.nomClientApprobation && errors.nomClientApprobation && (
              <div className={styles.approvalErrorMessage}>Client (1): {errors.nomClientApprobation}</div>
            )}
            {touched.nomClientApprobation2 && errors.nomClientApprobation2 && (
              <div className={styles.approvalErrorMessage}>Client (2): {errors.nomClientApprobation2}</div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bouton Voir la conclusion */}
      <div className={styles.buttonContainer}>
        <button
          type="button"
          className={styles.btnConclusion}
          onClick={() => setMode("conclusion")}
          disabled={!isFormValid()}
        >
          Voir la conclusion du contrat
        </button>
      </div>
        </>
      )}
    </section>
  );
}