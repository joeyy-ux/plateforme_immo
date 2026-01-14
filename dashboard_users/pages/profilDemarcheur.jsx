import React, { useState, useEffect } from "react";
import styles from "./ProfilDemarcheur.module.css"; // CSS Module
import { useNavigate } from "react-router-dom";
import { 
  FaBuilding, FaMapMarkerAlt, FaIdCard, FaUser, FaBriefcase, FaUserTie, FaPhone, FaAlignLeft, FaImage 
} from "react-icons/fa";
import axios from "axios";

const ProfilDemarcheur = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    adresse: "", description: "", statut: "", fonction: "", numero_fonction: "",
    photoLogo: null, pieceRecto: null, pieceVerso: null, selfie: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previews, setPreviews] = useState({
    photoLogo: null, pieceRecto: null, pieceVerso: null, selfie: null
  });

  // Générer les previews d’images
  useEffect(() => {
    const newPreviews = {};
    ["photoLogo", "pieceRecto", "pieceVerso", "selfie"].forEach(key => {
      if (formData[key]) newPreviews[key] = URL.createObjectURL(formData[key]);
      else newPreviews[key] = null;
    });
    setPreviews(newPreviews);

    return () => {
      Object.values(newPreviews).forEach(url => url && URL.revokeObjectURL(url));
    };
  }, [formData]);

  // Validation simple
  const validate = () => {
    const newErrors = {};

    if (!formData.adresse) newErrors.adresse = "L'adresse est obligatoire.";
    else if (formData.adresse.length < 5) newErrors.adresse = "Trop courte (min 5).";
    else if (formData.adresse.length > 100) newErrors.adresse = "Trop longue (max 100).";

    if (!formData.description) newErrors.description = "Description obligatoire.";
    else if (formData.description.length < 20) newErrors.description = "Trop courte (min 20).";
    else if (formData.description.length > 500) newErrors.description = "Trop longue (max 500).";

    const validStatuts = ["independant", "rattache", "proprietaire"];
    if (!validStatuts.includes(formData.statut)) newErrors.statut = "Veuillez sélectionner un statut.";

    if (formData.statut === "rattache" || formData.statut === "proprietaire") {
      if (!formData.fonction) newErrors.fonction = "Nom obligatoire.";
      if (!formData.numero_fonction || formData.numero_fonction.replace(/\D/g, "").length !== 10)
        newErrors.numero_fonction = "Numéro invalide, 10 chiffres requis.";
    }

    ["photoLogo", "pieceRecto", "pieceVerso", "selfie"].forEach(key => {
      if (!formData[key]) newErrors[key] = "Fichier obligatoire.";
      else if (formData[key].size > 2 * 1024 * 1024) newErrors[key] = "Le fichier ne peut pas dépasser 2 Mo.";
      else if (!["image/jpeg","image/jpg","image/png","image/gif"].includes(formData[key].type))
        newErrors[key] = "Format non autorisé.";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gestion des changements d’input
  const handleChange = e => {
    const { name, value, files } = e.target;
    if (files && files[0]) setFormData(prev => ({ ...prev, [name]: files[0] }));
    else setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Soumission du formulaire
  const handleSubmit = async e => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => formData[key] && data.append(key, formData[key]));

    try {
      const res = await axios.post(
        "http://localhost/plateforme_immobiliere/public/api_dashboard_users/demarcheur.php",
        data,
        { withCredentials: true, headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        // Stocker le message pour la page d'accueil
        sessionStorage.setItem("completerProfil_success", res.data.message);
        navigate("/accueil"); // Redirection vers la page d'accueil
      } else {
        setErrors(res.data.errors || { global: "Erreur inconnue." });
      }
    } catch {
      setErrors({ global: "Erreur serveur, veuillez réessayer." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderError = field => errors[field] && <div className={styles.error}>{errors[field]}</div>;

  return (
    <div className={styles.containerDemarcheur}>
      <div className={styles.ProfilDemarcheur}>
        <div className={styles.logo}><FaBuilding size={50} /></div>
        <h2 className={styles.title}>Compléter votre profil</h2>

        {errors.global && <div className={styles.error}>{errors.global}</div>}

        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* Adresse */}
          <div className={styles.inputGroup}>
            <label className={styles.inputGroupLabel}><FaMapMarkerAlt /> Adresse personnelle</label>
            <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} />
            {renderError("adresse")}
          </div>

          {/* Description */}
          <div className={styles.inputGroup}>
            <label className={styles.inputGroupLabel}><FaAlignLeft /> Décrivez-vous</label>
            <textarea name="description" rows={4} value={formData.description} onChange={handleChange} />
            {renderError("description")}
          </div>

          {/* Statut */}
          <div className={styles.inputGroup}>
            <label className={styles.inputGroupLabel}><FaBriefcase /> Statut professionnel</label>
            <select name="statut" value={formData.statut} onChange={handleChange}>
              <option value="">Sélectionnez</option>
              <option value="independant">Démarcheur indépendant</option>
              <option value="rattache">Rattaché à une agence</option>
              <option value="proprietaire">Propriétaire/Gérant de biens</option>
            </select>
            {renderError("statut")}
          </div>

          {(formData.statut === "rattache" || formData.statut === "proprietaire") && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.inputGroupLabel}><FaUserTie /> Nom de la personne / agence</label>
                <input type="text" name="fonction" value={formData.fonction} onChange={handleChange} />
                {renderError("fonction")}
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.inputGroupLabel}><FaPhone /> Contact de la personne</label>
                <input type="text" name="numero_fonction" value={formData.numero_fonction} onChange={handleChange} />
                {renderError("numero_fonction")}
              </div>
            </>
          )}

          {/* Uploads */}
          {["photoLogo", "pieceRecto", "pieceVerso", "selfie"].map(key => (
            <div key={key} className={styles.inputGroup}>
              <label className={styles.inputGroupLabel}>
                {key === "photoLogo" && <FaImage />}
                {key === "pieceRecto" && <FaIdCard />}
                {key === "pieceVerso" && <FaIdCard />}
                {key === "selfie" && <FaUser />}
                {" "} {key}
              </label>
              <div className={styles.previewContainer}>
                {previews[key] && <img src={previews[key]} alt={`preview-${key}`} />}
                <input type="file" name={key} accept="image/*" onChange={handleChange} />
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
};

export default ProfilDemarcheur;
