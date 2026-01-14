// Historique.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./historique.module.css";

export default function Historique() {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);

  const containerRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE =
    "http://localhost/plateforme_immo/public/api_dashboard_users";

  // ✅ BASE BACKEND POUR LES IMAGES
  const BACKEND_BASE_URL = "http://localhost/plateforme_immo/uploads/historique_bien/";

  /* =========================
     CHARGEMENT HISTORIQUE
  ========================= */
  useEffect(() => {
    let mounted = true;

    axios
      .post(`${API_BASE}/historique.php`, {}, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;

        if (res?.data?.success === false) {
          const msg =
            (res.data.errors &&
              (res.data.errors.global || res.data.errors.sql)) ||
            "Erreur serveur";
          setError(msg);
          setHistorique([]);
        } else {
          setHistorique(
            Array.isArray(res?.data?.historique) ? res.data.historique : []
          );
        }
      })
      .catch((err) => {
        console.error("historique error:", err);
        if (!mounted) return;
        setError(
          "Erreur lors du chargement de l'historique. Vérifie la session / CORS."
        );
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================
     NAVIGATION
  ========================= */
  const goToDetails = (idHistorique) => navigate(`/dashboard/historique_annonce/${idHistorique}`);

  /* =========================
     ÉTATS
  ========================= */
  if (loading)
    return <div className={styles.aucuneAnnonce}>Chargement...</div>;
  if (error)
    return <div className={styles.aucuneAnnonce}>{error}</div>;

  /* =========================
     RENDU
  ========================= */
  return (
    <section className={styles.mesBiens} ref={containerRef}>
      {message && (
        <div
          className={`${styles.messageBanner} ${
            message.type === "success"
              ? styles.msgSuccess
              : styles.msgError
          }`}
        >
          <span>{message.text}</span>
          <button
            className={styles.msgClose}
            onClick={() => setMessage(null)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.header}>
        <h1>Historique des biens supprimés</h1>
        <p>Consultez vos annonces supprimées et leurs détails</p>
      </div>

      <div className={styles.grilleCartes}>
        {historique.length === 0 ? (
          <div className={styles.aucuneAnnonce}>
            Aucun bien supprimé dans l'historique
          </div>
        ) : (
          historique.map((bien) => {
            const id = bien.id_historique;
            const titre = bien.titre ?? "Titre non disponible";

            // ✅ CORRECTION IMAGE ICI
            const photo =
              bien.photo_principale && bien.photo_principale.trim() !== ""
                ? `${BACKEND_BASE_URL}/${bien.photo_principale}`
                : "https://via.placeholder.com/600x400?text=Photo";

            return (
              <article className={styles.carteBien} key={id}>
                <div className={styles.photoBien}>
                  <img src={photo} alt={titre} loading="lazy" />
                  <span className={styles.statut}>
                    Supprimé
                  </span>
                </div>

                <div className={styles.infosBien}>
                  <h3 className={styles.titreText}>{titre}</h3>

                  <p className={styles.infoLine}>
                    <strong>Type :</strong> {bien.type_bien} - {bien.type_offre}
                  </p>
                  <p className={styles.infoLine}>
                    <strong>Prix :</strong> {bien.prix_bien}
                  </p>
                  <p className={styles.infoLine}>
                    <strong>Supprimé le :</strong>{" "}
                    {new Date(bien.date_suppression).toLocaleDateString("fr-FR")}
                  </p>
                  <p className={styles.infoLine}>
                    <strong>Motif :</strong> {bien.motif}
                  </p>

                  <div className={styles.actions}>
                    <button
                      className={styles.btnDetails}
                      onClick={() => goToDetails(bien.id_historique)}
                    >
                      Voir détails
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}