// MesAnnonces.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./mesAnnonces.module.css";
import SuccessCard from "./SuccessCard";

export default function MesAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [successCard, setSuccessCard] = useState(null);

  const containerRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE =
    "http://localhost/plateforme_immo/public/api_dashboard_users";

  // ✅ BASE BACKEND POUR LES IMAGES
  const BACKEND_BASE_URL = "http://localhost/plateforme_immo";

  /* =========================
     CHARGEMENT DES ANNONCES
  ========================= */
  useEffect(() => {
    let mounted = true;

    // Vérifier s'il y a un message de succès de suppression de bien
    const suppressionMsg = window.sessionStorage.getItem('suppression_bien_success');
    if (suppressionMsg) {
      setSuccessCard(suppressionMsg);
      window.sessionStorage.removeItem('suppression_bien_success');
    }

    // Vérifier s'il y a un message de succès de modification de bien
    const modificationMsg = window.sessionStorage.getItem('modification_success');
    if (modificationMsg) {
      setSuccessCard(modificationMsg);
      window.sessionStorage.removeItem('modification_success');
    }

    axios
      .post(`${API_BASE}/mes_annonces.php`, {}, { withCredentials: true })
      .then((res) => {
        if (!mounted) return;

        if (res?.data?.success === false) {
          const msg =
            (res.data.errors &&
              (res.data.errors.global || res.data.errors.sql)) ||
            "Erreur serveur";
          setError(msg);
          setAnnonces([]);
        } else {
          setAnnonces(
            Array.isArray(res?.data?.annonces) ? res.data.annonces : []
          );
        }
      })
      .catch((err) => {
        console.error("mes_annonces error:", err);
        if (!mounted) return;
        setError(
          "Erreur lors du chargement des annonces. Vérifie la session / CORS."
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
  const goToEdit = (id) => navigate(`/dashboard/annonces/${id}/modifier`);
  const goToDetails = (id) => navigate(`/dashboard/annonces/${id}`);
  const goToDelete = (id) => navigate(`/dashboard/annonces/${id}/supprimer`);
  const goToContrat = (id) => navigate(`/dashboard/contrat?id=${id}`);

  const dismissSuccessCard = () => setSuccessCard(null);

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

      <div className={styles.grilleCartes}>
        {annonces.length === 0 ? (
          <div className={styles.aucuneAnnonce}>
            Vous n'avez encore publié aucune annonce.
          </div>
        ) : (
          annonces.map((annonce, index) => {
            const id = annonce.id ?? `tmp-${index}`;
            const titre = annonce.titre ?? "Titre non disponible";

            // ✅ CORRECTION IMAGE ICI
            const photo =
              annonce.photo && annonce.photo.trim() !== ""
                ? `${BACKEND_BASE_URL}/${annonce.photo}`
                : "https://via.placeholder.com/600x400?text=Photo";

            const statut = (annonce.statut || "attente").toLowerCase();
            const statutClass =
              statut === "publie"
                ? styles.publie
                : statut === "suspendre"
                ? styles.suspendu
                : styles.attente;

            const statutLabel =
              statut === "publie"
                ? "Publié"
                : statut === "suspendre"
                ? "Suspendu"
                : "En attente";

            return (
              <article className={styles.carteBien} key={id}>
                <div className={styles.photoBien}>
                  <img src={photo} alt={titre} loading="lazy" />
                  <span className={`${styles.statut} ${statutClass}`}>
                    {statutLabel}
                  </span>
                </div>

                <div className={styles.infosBien}>
                  <h3 className={styles.titreText}>{titre}</h3>

                  <p className={styles.infoLine}>
                    <strong>Type :</strong> {annonce.type}
                  </p>
                  <p className={styles.infoLine}>
                    <strong>Offre :</strong> {annonce.offre}
                  </p>
                  <p className={styles.infoLine}>
                    <strong>Ville :</strong>{" "}
                    {annonce.ville || "Non renseignée"}
                  </p>

                  {annonce.prix && (
                    <p className={styles.price}>
                      <strong>Prix :</strong> {annonce.prix}
                    </p>
                  )}

                  {annonce.since && (
                    <p className={styles.since}>
                      <strong>Publié :</strong> {annonce.since}
                    </p>
                  )}

                  <div className={styles.actions}>
                    <button
                      className={styles.btnDetails}
                      onClick={() => goToDetails(id)}
                    >
                      Voir
                    </button>

                    <button
                      className={styles.modifyBtn}
                      onClick={() => goToEdit(id)}
                    >
                      Modifier
                    </button>

                    <button
                      className={styles.deleteBtn}
                      onClick={() => goToDelete(id)}
                    >
                      Supprimer
                    </button>

                    <button
                      className={styles.contratBtn}
                      onClick={() => goToContrat(id)}
                    >
                      Bien conclus ? Effectuer un contrat
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {successCard && (
        <SuccessCard message={successCard} onClose={dismissSuccessCard} />
      )}
    </section>
  );
}
