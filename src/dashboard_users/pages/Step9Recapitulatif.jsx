import React from "react";
import styles from "./Step9Recapitulatif.module.css";
import { FaEdit, FaCheckCircle } from "react-icons/fa";

/* =========================
   HELPERS GÉNÉRIQUES
========================= */
const displayValue = (v) =>
  v !== undefined && v !== null && v !== ""
    ? v
    : "Aucun renseignement";

const displayArray = (arr) =>
  Array.isArray(arr) && arr.length > 0
    ? arr.join(", ")
    : "Aucun renseignement pour cette partie";

/* =========================
   HELPERS ROBUSTES
========================= */

/**
 * Gère :
 * - tableau simple
 * - objet { liste, autres }
 * - null / undefined
 */
const normalizeList = (data) => {
  if (Array.isArray(data)) {
    return data.filter((v) => v && String(v).trim() !== "");
  }

  if (data && typeof data === "object") {
    return [
      ...(Array.isArray(data.liste) ? data.liste : []),
      ...(Array.isArray(data.autres)
        ? data.autres.filter((v) => v && String(v).trim() !== "")
        : []),
    ];
  }

  return [];
};

/**
 * Conditions de paiement
 * (aligné EXACTEMENT avec Step7)
 */
const normalizeConditionsPaiement = (data) => {
  if (!Array.isArray(data)) return [];
  return data.filter((v) => v && String(v).trim() !== "");
};

/**
 * Caractéristiques extérieures
 */
const normalizeExterieur = (data) => {
  if (!data) return [];

  return [
    ...(Array.isArray(data.exterieur) ? data.exterieur : []),
    ...(Array.isArray(data.exterieur_autres)
      ? data.exterieur_autres.filter((v) => v && v.trim() !== "")
      : []),
  ];
};

/* =========================
   COMPONENT
========================= */
const Step9Recapitulatif = ({
  formData,
  goToStep,
  onSubmit,
  loading,
  error,
}) => {
  const {
    informations_generales = {},
    localisation = {},
    caracteristiques = {},
    documents = [],
    accessibilite = {},
    commodites = {},
    conditions_bonus = {},
    medias = {},
  } = formData;

  return (
    <>
      <h2 className={styles.stepTitle}>Récapitulatif</h2>
      <p className={styles.stepDescription}>
        Vérifiez attentivement les informations avant de publier l’annonce.
      </p>

      {/* =========================
          INFORMATIONS GÉNÉRALES
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Informations générales</h3>
          <button onClick={() => goToStep(1)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <ul>
          <li>Type de bien : {displayValue(informations_generales.type_bien)}</li>
          <li>Type d’offre : {displayValue(informations_generales.type_offre)}</li>
          <li>Statut : {displayValue(informations_generales.statut)}</li>
          <li>Meublé : {displayValue(informations_generales.meuble)}</li>
          <li>Disponibilité : {displayValue(informations_generales.disponibilite)}</li>
          <li>Surface : {displayValue(informations_generales.surface)}</li>
          <li>Prix : {displayValue(informations_generales.prix_bien)}</li>
          <li>Frais de visite : {displayValue(informations_generales.frais_visite)}</li>
          <li>Prix visite : {displayValue(informations_generales.prix_visite)}</li>
          <li>Titre : {displayValue(informations_generales.titre)}</li>
          <li>Description : {displayValue(informations_generales.description)}</li>
        </ul>
      </section>

      {/* =========================
          LOCALISATION
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Localisation</h3>
          <button onClick={() => goToStep(2)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <ul>
          <li>Ville : {displayValue(localisation.ville)}</li>
          <li>Commune : {displayValue(localisation.commune)}</li>
          <li>Quartier : {displayValue(localisation.quartier)}</li>
        </ul>
      </section>

      {/* =========================
          CARACTÉRISTIQUES
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Caractéristiques</h3>
          <button onClick={() => goToStep(3)}>
            <FaEdit /> Modifier
          </button>
        </header>

        <h4>Intérieures</h4>
        {Array.isArray(caracteristiques.interieur) &&
        caracteristiques.interieur.length > 0 ? (
          <ul>
            {caracteristiques.interieur.map((c, i) => (
              <li key={i}>
                <strong>{c.titre}</strong> : {c.contenu}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Aucun renseignement</p>
        )}

        <h4>Extérieures</h4>
        <p>{displayArray(normalizeExterieur(caracteristiques))}</p>
      </section>

      {/* =========================
          DOCUMENTS
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Documents</h3>
          <button onClick={() => goToStep(4)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <p>{displayArray(documents)}</p>
      </section>

      {/* =========================
          ACCESSIBILITÉ
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Accessibilité</h3>
          <button onClick={() => goToStep(5)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <p>{displayArray(normalizeList(accessibilite))}</p>
      </section>

      {/* =========================
          COMMODITÉS
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Commodités</h3>
          <button onClick={() => goToStep(6)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <p>{displayArray(normalizeList(commodites))}</p>
      </section>

      {/* =========================
          CONDITIONS & BONUS
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Conditions & bonus</h3>
          <button onClick={() => goToStep(7)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <ul>
          <li>
            Conditions de paiement :{" "}
            {displayArray(
              normalizeConditionsPaiement(
                conditions_bonus.conditions_paiement
              )
            )}
          </li>
          <li>
            Bonus :{" "}
            {displayArray(normalizeList(conditions_bonus.bonus))}
          </li>
        </ul>
      </section>

      {/* =========================
          MÉDIAS
      ========================= */}
      <section className={styles.section}>
        <header>
          <h3>Médias</h3>
          <button onClick={() => goToStep(8)}>
            <FaEdit /> Modifier
          </button>
        </header>
        <ul>
          <li>
            Photo principale :{" "}
            {medias.photo_principale ? "Oui" : "Aucun renseignement"}
          </li>
          <li>
            Photos par pièce :{" "}
            {Array.isArray(medias.pieces) && medias.pieces.length > 0
              ? `${medias.pieces.length} pièce(s)`
              : "Aucun renseignement"}
          </li>
          <li>
            Vidéo :{" "}
            {medias.video?.platform && medias.video?.url
              ? medias.video.platform
              : "Aucun renseignement"}
          </li>
        </ul>
      </section>

      {/* =========================
          CONFIRMATION
      ========================= */}
      <div className={styles.confirmation}>
        <FaCheckCircle />
        <p>Je confirme que les informations fournies sont exactes.</p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <button
        className={styles.submitBtn}
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Publication..." : "Publier l’annonce"}
      </button>
    </>
  );
};

export default Step9Recapitulatif;
