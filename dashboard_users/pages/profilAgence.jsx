import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./profilAgence.module.css";
import { FaMapMarkerAlt, FaIdCard, FaFileContract, FaBriefcase, FaAlignLeft, FaImage } from "react-icons/fa";

const CompleterProfil = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    adresse: "",
    nif: "",
    rccm: "",
    experience: "",
    description: "",
    logo: null,
  });
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState("");
  const [touchedFields, setTouchedFields] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Validation d'un champ ---
  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "adresse":
        if (!value.trim()) error = "Adresse obligatoire";
        else if (value.length < 5) error = "Trop courte (min 5)";
        else if (value.length > 100) error = "Trop longue (max 100)";
        else if (!/^[a-zA-Z0-9\s,.\-]+$/.test(value)) error = "Caractères non autorisés";
        break;
      case "nif":
        if (value && !/^CI-\d{10}[A-Z0-9]{2}$/.test(value)) error = "Format NIF invalide";
        break;
      case "rccm":
        if (value && !/^CI-[A-Z]{3}-\d{4}-[A-Z]-\d{5}$/.test(value)) error = "Format RCCM invalide";
        break;
      case "experience":
        if (value) {
          const num = Number(value);
          if (!Number.isInteger(num) || num < 0 || num > 100)
            error = "Nombre entier entre 0 et 100 requis";
        }
        break;
      case "description":
        if (!value.trim()) error = "Description obligatoire";
        else if (value.length < 20) error = "Trop courte (min 20)";
        else if (value.length > 500) error = "Trop longue (max 500)";
        break;
      case "logo":
        if (!value) error = "Logo obligatoire";
        else if (!["image/jpeg","image/jpg","image/png","image/gif"].includes(value.type))
          error = "Format image non autorisé";
        else if (value.size > 2*1024*1024)
          error = "Taille max 2 Mo";
        break;
      default:
        break;
    }
    return error;
  };

  // --- Vérifier le formulaire complet ---
  const isFormValid = () => {
    const newErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Gestion des changements de champ ---
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "logo") {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(files[0]);
      } else {
        setPreview("");
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setTouchedFields(prev => new Set([...prev, name]));
  };

  // --- Soumission du formulaire ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      const res = await axios.post(
        "http://localhost/plateforme_immobiliere/public/api_dashboard_users/agence.php",
        data,
        {
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        // Stocker le message pour la page d'accueil
        window.sessionStorage.setItem(
          "completerProfil_success",
          "Profil agence complété avec succès !"
        );
        setErrors({});
        navigate("/accueil"); // redirection vers accueil
      } else {
        setErrors(res.data.errors || {});
      }
    } catch (err) {
      console.error(err);
      setErrors({ global: "Erreur serveur, réessayez !" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Classe CSS pour input en erreur ---
  const inputClass = (field) =>
    errors[field] && touchedFields.has(field) ? styles.inputError : "";

  return (
    <div className={styles.pageContainer}>
      <div className={styles.completerProfil}>
        {errors.global && <div className={styles.errorMessage}>{errors.global}</div>}

        <h2 className={styles.title}>Compléter votre profil</h2>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {["adresse","nif","rccm","experience"].map(field => (
            <div className={styles.inputGroup} key={field}>
              <label className={styles.label}>
                {field === "adresse" && <FaMapMarkerAlt />}
                {field === "nif" && <FaIdCard />}
                {field === "rccm" && <FaFileContract />}
                {field === "experience" && <FaBriefcase />}
                {" " + field.charAt(0).toUpperCase() + field.slice(1)}
              </label>

              <input
                type={field === "experience" ? "number" : "text"}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className={`${styles.input} ${inputClass(field)}`}
              />

              {errors[field] && touchedFields.has(field) && (
                <div className={styles.errorMessage}>{errors[field]}</div>
              )}
            </div>
          ))}

          <div className={styles.inputGroup}>
            <label className={styles.label}><FaAlignLeft /> Description</label>
            <textarea
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className={`${styles.textarea} ${inputClass("description")}`}
            />
            {errors.description && touchedFields.has("description") && (
              <div className={styles.errorMessage}>{errors.description}</div>
            )}
          </div>

          <div className={`${styles.inputGroup} ${styles.avatarContainer}`}>
            <label className={styles.label}><FaImage /> Logo / Avatar</label>
            <div className={styles.avatarPreview}>
              {preview && <img src={preview} alt="Logo" />}
            </div>
            <input type="file" name="logo" accept="image/*" onChange={handleChange} />
            {errors.logo && touchedFields.has("logo") && (
              <div className={styles.errorMessage}>{errors.logo}</div>
            )}
          </div>

          <button
            type="submit"
            className={`${styles.btn} ${isSubmitting ? styles.btnDisabled : ""}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Envoi..." : "Envoyer"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleterProfil;
