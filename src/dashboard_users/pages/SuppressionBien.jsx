import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./SuppressionBien.module.css";

/* =========================
   ICONES
========================= */
import { FaTrashAlt, FaExclamationTriangle, FaCheckCircle, FaArrowLeft } from "react-icons/fa";

const API_BASE = "http://localhost/plateforme_immo/public/api_dashboard_users";

export default function SuppressionBien() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [motif, setMotif] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const validateMotif = (value) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Le motif de suppression est obligatoire.";
    }
    if (trimmed.length < 10) {
      return "Le motif doit contenir au moins 10 caractères.";
    }
    if (value.length > 500) {
      return "Le motif ne peut pas dépasser 500 caractères.";
    }
    // Vérification des caractères interdits (comme dans les autres champs)
    const invalidChars = /[<>|&"']/;
    if (invalidChars.test(value)) {
      return "Le motif contient des caractères interdits (< > | & \" ').";
    }
    return "";
  };

  const isValid = (value) => {
    return validateMotif(value) === "" && value.trim().length >= 10;
  };

  const handleMotifChange = (e) => {
    const value = e.target.value;
    setMotif(value);
    setValidationError(validateMotif(value));
  };

  const handleDelete = async (e) => {
    e.preventDefault();
    
    const valError = validateMotif(motif);
    if (valError) {
      setValidationError(valError);
      return;
    }

    setLoading(true);
    setError("");
    setValidationError("");

    try {
      const formData = new FormData();
      formData.append('id_bien', id);
      formData.append('motif', motif.trim());
      
      const res = await axios.post(`${API_BASE}/supprimer_bien.php`, formData, { withCredentials: true });
      if (!res.data.success) throw new Error(res.data.error || "Erreur serveur");
      
      // Stocker le message de succès dans sessionStorage
      window.sessionStorage.setItem("suppression_bien_success", "Le bien a été supprimé avec succès et archivé dans l'historique.");
      
      // Rediriger vers la page des annonces
      navigate("/dashboard/annonces");
    } catch (e) {
      setError(e.message || "Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <FaTrashAlt className={styles.headerIcon} />
        <h2>Suppression du bien</h2>
      </div>

      <div className={styles.warning}>
        <FaExclamationTriangle className={styles.warningIcon} />
        <p>Attention : Cette action est irréversible. Le bien sera définitivement supprimé.</p>
      </div>

      <form onSubmit={handleDelete} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="motif">
              Motif de suppression <span className={styles.required}>*</span>
            </label>
            <textarea
              id="motif"
              value={motif}
              onChange={handleMotifChange}
              placeholder="Veuillez expliquer la raison de la suppression (minimum 10 caractères)..."
              rows={5}
              className={`${styles.textarea} ${
                motif && isValid(motif) ? styles.validBorder : validationError ? styles.errorBorder : ''
              }`}
            />
            <div className={`${styles.charCount} ${
              motif && isValid(motif) ? styles.valid : validationError ? styles.error : ''
            }`}>
              {motif.length}/500 caractères
            </div>
            {validationError && (
              <div className={styles.fieldError}>
                {validationError}
              </div>
            )}
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className={styles.cancelBtn}
              disabled={loading}
            >
              <FaArrowLeft /> Retour
            </button>
            <button
              type="submit"
              className={styles.deleteBtn}
              disabled={loading || !!validationError}
            >
              <FaTrashAlt />
              {loading ? "Suppression..." : "Supprimer définitivement"}
            </button>
          </div>
        </form>
    </div>
  );
}
