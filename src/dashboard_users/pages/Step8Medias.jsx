import React, { useEffect, useState } from "react";
import styles from "./Step8Medias.module.css";
import {
  FaPlus,
  FaTrash,
  FaImage,
  FaVideo,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

/* =========================
   CONSTANTES
========================= */
const MAX_MAIN_PHOTO_SIZE = 5 * 1024 * 1024;
const MAX_TOTAL_PHOTOS = 150;

const VIDEO_PLATFORMS = ["YouTube", "TikTok", "Vimeo"];

const FORBIDDEN_CHARS_REGEX =
  /[~`•√π÷×§∆£¥$¢^°={}\\%©®™✓[\]><!?@#,€]/;

const STORAGE_KEY = "publieBien_step8_text";


/* =========================
   UTILS VIDÉO
========================= */
const isYoutube = (url) =>
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(url);

const isTiktok = (url) =>
  /^(https?:\/\/)?(www\.)?tiktok\.com\//i.test(url);

const isVimeo = (url) =>
  /^(https?:\/\/)?(www\.)?vimeo\.com\//i.test(url);

const getYoutubeEmbed = (url) => {
  const id =
    url.split("v=")[1]?.split("&")[0] ||
    url.split("/").pop();
  return `https://www.youtube.com/embed/${id}`;
};

const getVimeoEmbed = (url) => {
  const id = url.split("/").pop();
  return `https://player.vimeo.com/video/${id}`;
};

const Step8Medias = ({
  formData,
  setFormData,
  nextStep,
  prevStep,
  backendErrors = {},
  setBackendErrors,
  isModification = false,
}) => {
  const [isValid, setIsValid] = useState(false);
  const [touched, setTouched] = useState({});

  const medias = {
    photo_principale: formData.medias?.photo_principale || null,
    pieces: formData.medias?.pieces || [],
    video: formData.medias?.video || { platform: "", url: "" },
  };

  /* =========================
     MARQUER TOUCHED
  ========================= */
  useEffect(() => {
    const t = {};

    if (medias.photo_principale instanceof File) {
      t.photo_principale = true;
    }

    medias.pieces.forEach((p, i) => {
      if (p.nom) t[`pieces.${i}.nom`] = true;
    });

    if (medias.video.platform) t["video.platform"] = true;
    if (medias.video.url) t["video.url"] = true;

    setTouched((prev) => ({ ...prev, ...t }));
  }, []);

  // Appliquer les erreurs backend : marquer touched sur les champs concernés
  useEffect(() => {
    if (!backendErrors || Object.keys(backendErrors).length === 0) return;

    const t = {};

    Object.keys(backendErrors).forEach((k) => {
      // photo principale
      if (k === 'photo_principale') t.photo_principale = true;
      // pieces_{i}_photos -> pieces.i.photos
      const m = k.match(/^pieces_(\d+)_photos$/);
      if (m) {
        const idx = parseInt(m[1], 10);
        t[`pieces.${idx}.photos`] = true;
      }
      // video
      if (k === 'video_platform') t['video.platform'] = true;
      if (k === 'video_url') t['video.url'] = true;
      // piece name errors may come as pieces_0_nom or pieces_0_name
      const m2 = k.match(/^pieces_(\d+)_nom$/);
      if (m2) {
        const idx = parseInt(m2[1], 10);
        t[`pieces.${idx}.nom`] = true;
      }
    });

    setTouched((prev) => ({ ...prev, ...t }));
  }, [backendErrors]);

  /* =========================
     RESTAURATION LOCALSTORAGE (corrigée)
     - Ne pas écraser les photos fournies par le backend lors de la modification
  ========================== */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);

      setFormData((prev) => {
        const prevPieces = prev.medias?.pieces || [];

        // Si on est en mode modification et qu'il y a déjà des pièces venant du backend
        // qui contiennent des photos (strings), on ne veut pas écraser ces photos.
        const hasBackendPhotos = prevPieces.some(
          (p) => p.photos && p.photos.length > 0 && p.photos.some(photo => typeof photo === "string")
        );

        if (isModification && hasBackendPhotos) {
          // On fusionne les noms sauvegardés (si fournis) avec les pièces existantes,
          // en conservant les photos existantes.
          const merged = prevPieces.map((p, idx) => ({
            nom: p.nom || (parsed.pieces?.[idx]?.nom || ""),
            photos: p.photos || [],
          }));

          return {
            ...prev,
            medias: {
              ...prev.medias,
              pieces: merged,
              video: parsed.video || prev.medias.video || { platform: "", url: "" },
            },
          };
        }

        // Cas par défaut : on restaure depuis le localStorage (ancien comportement)
        return {
          ...prev,
          medias: {
            ...prev.medias,
            pieces:
              parsed.pieces?.map((p) => ({
                nom: p.nom || "",
                photos: [],
              })) || [],
            video: parsed.video || prev.medias.video || { platform: "", url: "" },
          },
        };
      });
    } catch (e) {
      // ignore parse error
      console.error("Erreur parsing localStorage Step8Medias:", e);
    }
  }, [setFormData, isModification]);

  /* =========================
     SAUVEGARDE LOCALSTORAGE
  ========================= */
  useEffect(() => {
    const safe = {
      pieces: medias.pieces.map((p) => ({ nom: p.nom })),
      video: medias.video,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }, [medias.pieces, medias.video]);

  /* =========================
     VALIDATIONS
  ========================= */
  const validateText = (v) => {
    if (!v) return "Champ obligatoire";
    if (FORBIDDEN_CHARS_REGEX.test(v))
      return "Caractères non autorisés";
    if (v.length < 2 || v.length > 100)
      return "Entre 2 et 100 caractères";
    return null;
  };

  const validateMainPhoto = () => {
    // En mode modification, la photo peut déjà exister
    if (isModification && typeof medias.photo_principale === 'string') {
      return null; // Photo existante valide
    }
    if (!(medias.photo_principale instanceof File))
      return "Photo principale obligatoire";
    if (medias.photo_principale.size > MAX_MAIN_PHOTO_SIZE)
      return "Taille maximale 5 Mo";
    return null;
  };

  const validatePlatform = () =>
    !medias.video.platform ? "Plateforme obligatoire" : null;

  const validateVideoLink = () => {
    if (!medias.video.url) return "Lien vidéo obligatoire";
    if (
      medias.video.platform === "YouTube" &&
      !isYoutube(medias.video.url)
    )
      return "Lien YouTube invalide";
    if (
      medias.video.platform === "TikTok" &&
      !isTiktok(medias.video.url)
    )
      return "Lien TikTok invalide";
    if (
      medias.video.platform === "Vimeo" &&
      !isVimeo(medias.video.url)
    )
      return "Lien Vimeo invalide";
    return null;
  };

  /* =========================
     UPDATE GLOBAL
  ========================= */
  const updateMedias = (data, key) => {
    // compute prospective medias after this change
    const prospectiveMedias = { ...medias, ...(data || {}) };
    if (key) setTouched((t) => ({ ...t, [key]: true }));

    // Clear backend error for this key when user modifies the field and local validation passes
    if (key && typeof setBackendErrors === 'function') {
      const be = { ...(Array.isArray(backendErrors) ? {} : backendErrors) };
      const parts = key.split('.');

      if (parts[0] === 'pieces') {
        const idx = parseInt(parts[1], 10);
        const name = prospectiveMedias.pieces?.[idx]?.nom || "";
        const nameErr = validateText(name);
        // If name valid, remove name error
        if (!nameErr) delete be[`pieces_${idx}_nom`];
        // If piece has photos (existing or new), remove photos error
        const p = prospectiveMedias.pieces?.[idx];
        const hasExisting = p?.photos?.some(ph => typeof ph === 'string');
        const hasNew = p?.photos?.some(ph => ph instanceof File);
        if (hasExisting || hasNew) delete be[`pieces_${idx}_photos`];
      }

      if (key === 'photo_principale') {
        // if main photo present or existing in modification, clear
        const okMain = (isModification && typeof prospectiveMedias.photo_principale === 'string') || prospectiveMedias.photo_principale instanceof File;
        if (okMain) delete be['photo_principale'];
      }

      if (key === 'video.platform') {
        if (!validatePlatform()) delete be['video_platform'];
      }

      if (key === 'video.url') {
        if (!validateVideoLink()) delete be['video_url'];
      }

      setBackendErrors(be);
    }

    setFormData((prev) => ({
      ...prev,
      medias: {
        photo_principale: prev.medias?.photo_principale || null,
        pieces: prev.medias?.pieces || [],
        video: prev.medias?.video || { platform: "", url: "" },
        ...data,
      },
    }));
  };

  /* =========================
     PIÈCES
  ========================= */
  const addPiece = () =>
    updateMedias({
      pieces: [...medias.pieces, { nom: "", photos: [] }],
    });

  const addPhotos = (index, files) => {
    const list = [...medias.pieces];
    // Filtrer seulement les nouveaux fichiers, garder les existants
    const newFiles = files.filter((f) => f instanceof File);
    list[index].photos = [
      ...list[index].photos,
      ...newFiles,
    ];
    // Marquer la zone photos de la pièce comme touchée
    setTouched((t) => ({ ...t, [`pieces.${index}.photos`]: true }));
    // Supprimer l'erreur backend pour cette pièce si présente
    if (typeof setBackendErrors === 'function') {
      setBackendErrors((prev) => {
        const copy = { ...prev };
        delete copy[`pieces_${index}_photos`];
        return copy;
      });
    }
    updateMedias({ pieces: list });
  };

  const removePhoto = (pi, i) => {
    const list = [...medias.pieces];
    list[pi].photos.splice(i, 1);
    updateMedias({ pieces: list });
  };

  const removePiece = (i) =>
    updateMedias({
      pieces: medias.pieces.filter((_, idx) => idx !== i),
    });

  const totalPhotos = medias.pieces.reduce(
    (sum, p) => sum + p.photos.filter(photo => photo instanceof File).length,
    0
  );

  /* =========================
     VALIDATION GLOBALE
  ========================= */
  useEffect(() => {
    let ok = true;

    if (validateMainPhoto()) ok = false;
    if (medias.pieces.length === 0) ok = false;

    medias.pieces.forEach((p) => {
      if (validateText(p.nom)) ok = false;
      // En mode modification, vérifier les photos existantes ou nouvelles
      const hasExistingPhotos = p.photos.some(photo => typeof photo === 'string');
      const hasNewPhotos = p.photos.some(photo => photo instanceof File);
      if (!hasExistingPhotos && !hasNewPhotos) ok = false;
    });

    if (totalPhotos > MAX_TOTAL_PHOTOS) ok = false;
    if (validatePlatform()) ok = false;
    if (validateVideoLink()) ok = false;
    if (Object.keys(backendErrors).length > 0) ok = false;

    setIsValid(ok);
  }, [medias, totalPhotos, backendErrors]);

  /* =========================
     RENDER
  ========================= */
  return (
    <>
      <h2 className={styles.stepTitle}>Médias</h2>

      {/* PHOTO PRINCIPALE */}
      <div className={styles.field}>
        <label className={styles.label}>
          <FaImage className={styles.labelIcon} />
          Photo principale *
        </label>

        <div className={styles.inputWrapper}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              updateMedias(
                { photo_principale: e.target.files[0] },
                "photo_principale"
              )
            }
          />
        </div>
      </div>

      {(medias.photo_principale instanceof File || (isModification && typeof medias.photo_principale === 'string')) && (
        <div className={styles.centerPreview}>
          <img
            src={medias.photo_principale instanceof File ? URL.createObjectURL(medias.photo_principale) : `http://localhost/plateforme_immobiliere/${medias.photo_principale}`}
            className={styles.preview}
            alt=""
          />
          {isModification && typeof medias.photo_principale === 'string' && (
            <p className={styles.existingPhotoLabel}>Photo principale actuelle</p>
          )}
        </div>
      )}

      {/* PIÈCES */}
      <h3 className={styles.sectionTitle}>Photos par pièce *</h3>

      {medias.pieces.map((piece, index) => {
        const key = `pieces.${index}.nom`;
        const error = touched[key] && validateText(piece.nom);

        return (
          <div key={index} className={styles.block}>
            <div className={styles.blockHeader}>
              <span>Pièce {index + 1}</span>
              <button onClick={() => removePiece(index)}>
                <FaTrash />
              </button>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <FaImage className={styles.labelIcon} />
                Nom de la pièce *
              </label>

              <div className={styles.inputWrapper}>
                <input
                  type="text"
                  value={piece.nom}
                  onChange={(e) => {
                    const list = [...medias.pieces];
                    list[index].nom = e.target.value;
                    updateMedias({ pieces: list }, key);
                  }}
                  className={
                    error
                      ? styles.error
                      : touched[key]
                      ? styles.valid
                      : ""
                  }
                />
                {error && (
                  <FaExclamationCircle className={styles.errorIcon} />
                )}
                {!error && touched[key] && (
                  <FaCheckCircle className={styles.validIcon} />
                )}
              </div>
            </div>

            {/* Input photos */}
            <div className={styles.field}>
              <div className={styles.fileWrapper + ' ' + styles.inputWrapper + ' ' + (touched[`pieces.${index}.photos`] && backendErrors[`pieces_${index}_photos`] ? styles.error : (touched[`pieces.${index}.photos`] ? styles.valid : ''))}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    addPhotos(index, Array.from(e.target.files))
                  }
                />
              </div>
              {touched[`pieces.${index}.photos`] && backendErrors[`pieces_${index}_photos`] && (
                <p className={styles.errorText}>{backendErrors[`pieces_${index}_photos`]}</p>
              )}
            </div>

            <div className={styles.previewGrid}>
              {piece.photos.map(
                (p, i) => (
                  <div key={i} className={styles.photoItem}>
                    <img
                      src={p instanceof File ? URL.createObjectURL(p) : `http://localhost/plateforme_immobiliere/${p}`}
                      alt=""
                    />
                    <button onClick={() => removePhoto(index, i)}>
                      <FaTrash />
                    </button>
                    {p instanceof File && (
                      <div className={styles.photoLabel}>
                        Nouvelle
                      </div>
                    )}
                    {!(p instanceof File) && isModification && (
                      <div className={styles.photoLabel}>
                        Existante
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}

      <button className={styles.addBtn} onClick={addPiece}>
        <FaPlus /> Ajouter une pièce
      </button>

      <p className={styles.note}>
        Photos : {totalPhotos} / {MAX_TOTAL_PHOTOS}
      </p>

      {/* VIDÉO */}
      <h3 className={styles.sectionTitle}>Vidéo *</h3>

      <div className={styles.field}>
        <label className={styles.label}>
          <FaVideo className={styles.labelIcon} />
          Plateforme *
        </label>

        <select
          value={medias.video.platform}
          onChange={(e) =>
            updateMedias(
              {
                video: {
                  ...medias.video,
                  platform: e.target.value,
                },
              },
              "video.platform"
            )
          }
        >
          <option value="">Sélectionner</option>
          {VIDEO_PLATFORMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>
          <FaVideo className={styles.labelIcon} />
          Lien vidéo *
        </label>

        <input
          type="url"
          disabled={!medias.video.platform}
          value={medias.video.url}
          onChange={(e) =>
            updateMedias(
              {
                video: {
                  ...medias.video,
                  url: e.target.value,
                },
              },
              "video.url"
            )
          }
        />
      </div>

      {!validatePlatform() &&
        !validateVideoLink() &&
        medias.video.platform === "YouTube" && (
          <iframe
            className={styles.video}
            src={getYoutubeEmbed(medias.video.url)}
            allowFullScreen
            title="YouTube"
          />
        )}

      {!validatePlatform() &&
        !validateVideoLink() &&
        medias.video.platform === "Vimeo" && (
          <iframe
            className={styles.video}
            src={getVimeoEmbed(medias.video.url)}
            allowFullScreen
            title="Vimeo"
          />
        )}

      {!validatePlatform() &&
        !validateVideoLink() &&
        medias.video.platform === "TikTok" && (
          <div className={styles.tiktokPreview}>
            <div className={styles.tiktokIcon}>🎵</div>
            <p>Vidéo TikTok valide</p>
            <a
              href={medias.video.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ouvrir sur TikTok
            </a>
          </div>
        )}

      <div className={styles.actions}>
        <button onClick={prevStep}>Précédent</button>
        <button disabled={!isValid} onClick={nextStep}>
          Suivant
        </button>
      </div>
    </>
  );
};

export default Step8Medias;