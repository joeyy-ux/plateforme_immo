import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaImage, FaIdCard, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilProprio.module.css";

export default function ProfilProprio() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    adresse: "",
    description: "",
    photoLogo: null,
    pieceRecto: null,
    pieceVerso: null,
    selfie: null
  });

  const [previews, setPreviews] = useState({
    photoLogo: null,
    pieceRecto: null,
    pieceVerso: null,
    selfie: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Générer les previews
  useEffect(() => {
    const newPreviews = {};
    ["photoLogo","pieceRecto","pieceVerso","selfie"].forEach(key => {
      if (formData[key]) newPreviews[key] = URL.createObjectURL(formData[key]);
      else newPreviews[key] = null;
    });
    setPreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [formData]);

  // -----------------------------
  // Gestion changements texte
  // -----------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  // -----------------------------
  // Gestion fichiers
  // -----------------------------
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files.length) return;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  // -----------------------------
  // Validation
  // -----------------------------
  const validate = () => {
    const newErrors = {};

    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est obligatoire.";
    else if (formData.adresse.length < 5) newErrors.adresse = "Trop courte (min 5).";
    else if (formData.adresse.length > 100) newErrors.adresse = "Trop longue (max 100).";

    if (!formData.description.trim()) newErrors.description = "Description obligatoire.";
    else if (formData.description.length < 20) newErrors.description = "Trop courte (min 20).";
    else if (formData.description.length > 500) newErrors.description = "Trop longue (max 500).";

    ["photoLogo","pieceRecto","pieceVerso","selfie"].forEach(key => {
      if (!formData[key]) newErrors[key] = "Fichier obligatoire.";
      else if (formData[key].size > 2 * 1024 * 1024) newErrors[key] = "Le fichier ne peut pas dépasser 2 Mo.";
      else if (!["image/jpeg","image/jpg","image/png","image/gif"].includes(formData[key].type))
        newErrors[key] = "Format de fichier non autorisé.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  // Soumission
  // -----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => payload.append(key, value));

    try {
      const res = await axios.post(
        "http://localhost/plateforme_immobiliere/public/api_dashboard_users/proprio.php",
        payload,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        // Stocker message pour accueil
        window.sessionStorage.setItem("completerProfil_success", res.data.message);

        // Réinitialiser erreurs et formulaire
        setErrors({});
        setFormData({
          adresse: "",
          description: "",
          photoLogo: null,
          pieceRecto: null,
          pieceVerso: null,
          selfie: null
        });

        // Redirection après 1.5s
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setErrors(res.data.errors || { global: "Erreur serveur" });
      }
    } catch {
      setErrors({ global: "Erreur serveur ou réseau" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = key => errors[key] && <div className={styles.errorMsg}>{errors[key]}</div>;

  // -----------------------------
  // JSX
  // -----------------------------
  return (
    <div className={styles.containerProprio}>
      <div className={styles.ProfilProprio}>
        <h2>Compléter votre profil</h2>
        {errors.global && <div className={styles.errorMsg}>{errors.global}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Adresse */}
          <div className={styles.inputGroup}>
            <label><FaIdCard /> Adresse personnelle</label>
            <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
            {renderError("adresse")}
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label>Description</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange} />
            {renderError("description")}
          </div>

          {/* Upload fichiers */}
          {["photoLogo","pieceRecto","pieceVerso","selfie"].map(key => (
            <div key={key} className={styles.inputGroup}>
              <label>
                {key === "photoLogo" && <FaImage />}
                {(key === "pieceRecto" || key === "pieceVerso") && <FaIdCard />}
                {key === "selfie" && <FaUser />}
                {" "} {key === "photoLogo" ? "Logo" : key === "pieceRecto" ? "CNI Recto" : key === "pieceVerso" ? "CNI Verso" : "Selfie"}
              </label>
              <div className={styles.previewContainer}>
                {previews[key] && <img src={previews[key]} alt={`preview-${key}`} className={styles.previewImg} />}
                <input type="file" name={key} accept="image/*" onChange={handleFileChange} />
              </div>
              {renderError(key)}
            </div>
          ))}

          <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
}
