// HistoriqueDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./historiqueDetail.module.css";

export default function HistoriqueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost/plateforme_immo/public/api_dashboard_users";
  const BACKEND_BASE_URL = "http://localhost/plateforme_immo/uploads/historique_bien/";

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${API_BASE}/historique_details.php?id=${id}`, {
          withCredentials: true
        });

        if (!res.data.success) {
          throw new Error(res.data.erreur || "Erreur serveur");
        }

        setDetails(res.data.details);
      } catch (err) {
        console.error("historique details error:", err);
        setError(err.message || "Erreur lors du chargement des détails");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Chargement des détails...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/dashboard/historique")} className={styles.backBtn}>
          Retour à l'historique
        </button>
      </div>
    );
  }

  if (!details) {
    return (
      <div className={styles.error}>
        <h2>Non trouvé</h2>
        <p>Les détails de ce bien historique sont introuvables.</p>
        <button onClick={() => navigate("/dashboard/historique")} className={styles.backBtn}>
          Retour à l'historique
        </button>
      </div>
    );
  }

  const { informations_generales, motif_suppression, date_suppression } = details;

  return (
    <div className={styles.pageContainer}>
      {/* Bouton retour et image principale */}
      <div className={styles.topSection}>
        <button onClick={() => navigate("/dashboard/historique")} className={styles.backBtn}>
          ← Retour à l'historique
        </button>

        <div className={styles.imageCard}>
          <div className={styles.cardContent}>
            {details.photo_principale ? (
              <img
                src={`${BACKEND_BASE_URL}/${details.photo_principale}`}
                alt={informations_generales.titre}
                className={styles.mainImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={styles.imagePlaceholder} style={{display: details.photo_principale ? 'none' : 'flex'}}>
              <span>Pas d'image principale</span>
            </div>
            <span className={styles.imageBadge}>Supprimé</span>
          </div>
        </div>
      </div>

      {/* Informations importantes du bien */}
      <div className={styles.infoCard}>
        <div className={styles.cardHeader}>
          <h2>🏠 Informations générales</h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.infoList}>
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>🏷️</span>
              <strong>Titre :</strong> {informations_generales.titre}
            </div>
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>🏢</span>
              <strong>Type :</strong> {informations_generales.type_bien}
            </div>
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>🤝</span>
              <strong>Offre :</strong> {informations_generales.type_offre}
            </div>
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>💰</span>
              <strong>Prix :</strong> {informations_generales.prix_bien}
            </div>
            {informations_generales.surface && (
              <div className={styles.infoWithIcon}>
                <span className={styles.icon}>📏</span>
                <strong>Surface :</strong> {informations_generales.surface}
              </div>
            )}
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>👁️</span>
              <strong>Frais visite :</strong> {informations_generales.frais_visite}
            </div>
            <div className={styles.infoWithIcon}>
              <span className={styles.icon}>📅</span>
              <strong>Publication :</strong> {new Date(informations_generales.date_publication).toLocaleDateString("fr-FR")}
            </div>
          </div>

          <div className={styles.descriptionSection}>
            <h3>📝 Description</h3>
            <p className={styles.descriptionText}>{informations_generales.description}</p>
          </div>
        </div>
      </div>

      {/* Motif de suppression */}
      <div className={styles.motifCard}>
        <div className={styles.cardHeader}>
          <h2>Motif de suppression</h2>
        </div>
        <div className={styles.cardContent}>
          <p className={styles.motifText}>{motif_suppression}</p>
          <div className={styles.suppressionDate}>
            <span className={styles.dateLabel}>Date de suppression:</span>
            <span className={styles.dateValue}>
              {new Date(date_suppression).toLocaleDateString("fr-FR")}
            </span>
          </div>
        </div>
      </div>

      {/* Message d'information */}
      <div className={styles.warningCard}>
        <div className={styles.cardHeader}>
          <h2>ℹ️ Informations importantes</h2>
        </div>
        <div className={styles.cardContent}>
          <div className={styles.warningMessage}>
            <p>
              Les données détaillées (localisation, caractéristiques, documents, etc.) ne sont plus disponibles
              car elles ont été supprimées de la base de données lors de la suppression du bien.
              Seules les informations générales et le motif de suppression sont conservés dans l'historique.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}