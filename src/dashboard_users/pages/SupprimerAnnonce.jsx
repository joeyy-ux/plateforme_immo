// SupprimerAnnonce.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./SupprimerAnnonce.module.css";

export default function SupprimerAnnonce() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_BASE = "http://localhost/plateforme_immo/public/api_dashboard_users";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motif.trim()) {
      setError("Veuillez saisir un motif de suppression.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${API_BASE}/supprimer_bien.php`,
        { id, motif: motif.trim() },
        { withCredentials: true }
      );

      if (res?.data?.success) {
        alert("Annonce supprimée avec succès.");
        navigate("/dashboard/annonces");
      } else {
        const msg = res?.data?.message || "Erreur lors de la suppression.";
        setError(msg);
      }
    } catch (err) {
      console.error("Erreur suppression:", err);
      setError("Erreur réseau lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Supprimer l'annonce</h2>
        <p>Êtes-vous sûr de vouloir supprimer cette annonce ? Cette action est irréversible.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="motif">Motif de suppression *</label>
            <textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Veuillez expliquer la raison de la suppression..."
              rows={4}
              required
              className={styles.textarea}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.cancelBtn}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.deleteBtn}
              disabled={loading}
            >
              {loading ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}