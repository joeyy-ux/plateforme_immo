// AnnonceDetail.jsx
// ==============================
// DÉTAIL COMPLET D'UNE ANNONCE
// ==============================

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./AnnonceDetail.module.css";

/* =========================
   ICONES
========================= */
import {
  FaHome,
  FaHandshake,
  FaBell,
  FaFileAlt,
  FaImages,
  FaVideo,
  FaTree,
  FaWheelchair,
  FaCouch,
  FaGift,
  FaAlignLeft,
  FaDoorOpen,
  FaFolder,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaExpand,
  FaCompress,
  FaShareAlt,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaEuroSign,
  FaRulerCombined,
  FaCalendarAlt,
  FaBuilding,
  FaTag,
  FaDoorClosed,
  FaCity,
  FaRoad,
  FaEye,
  FaBed,
  FaBath,
  FaCar,
  FaUtensils
} from "react-icons/fa";

/* =========================
   CONFIG
========================= */
const API_BASE = "http://localhost/plateforme_immo/public/api_dashboard_users";
const FILE_BASE_URL = "http://localhost/plateforme_immo/";

/* =========================
   HELPERS
========================= */
const hasData = (v) =>
  v !== undefined && v !== null && v !== "" && (!Array.isArray(v) || v.length > 0);

/* =========================
   VIDEO EMBED
========================= */
const getEmbedVideo = (video) => {
  if (!video?.lien_video) return null;
  const url = video.lien_video;

  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const m = url.match(/v=([^&]+)/) || url.match(/youtu\.be\/([^?\s]+)/);
    return m ? { platform: "YouTube", src: `https://www.youtube.com/embed/${m[1]}` } : null;
  }

  if (url.includes("vimeo.com")) {
    const m = url.match(/vimeo\.com\/(\d+)/);
    return m ? { platform: "Vimeo", src: `https://player.vimeo.com/video/${m[1]}` } : null;
  }

  return null;
};

/* =========================
   COMPONENT
========================= */
export default function AnnonceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  /* =========================
     STATES
  ========================= */
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("photos");
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const scrollRef = useRef(null);

  /* =========================
     DÉTECTION MOBILE
  ========================= */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* =========================
     CARROUSEL MOBILE
  ========================= */
  const nextSlide = () => {
    if (!data?.pieces_with_photos) return;
    setCurrentSlide(prev => 
      prev >= data.pieces_with_photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    if (!data?.pieces_with_photos) return;
    setCurrentSlide(prev => 
      prev <= 0 ? data.pieces_with_photos.length - 1 : prev - 1
    );
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    
    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  /* =========================
     SCROLL FUNCTIONS FOR DESKTOP
  ========================= */
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -250, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 250, behavior: 'smooth' });
    }
  };

  /* =========================
     FETCH BACKEND
  ========================= */
  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/details_bien.php`, {
        params: { id },
        withCredentials: true,
      });

      if (res?.data?.success) {
        setData(res.data);
      } else {
        setError(res?.data?.message || "Annonce introuvable");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  /* =========================
     GESTION ANNONCE
  ========================= */
  const handleEdit = () => {
    navigate(`/edit-annonce/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette annonce ?")) {
      try {
        const response = await axios.delete(`${API_BASE}/delete_bien.php`, {
          params: { id },
          withCredentials: true,
        });
        
        if (response.data.success) {
          alert("Annonce supprimée avec succès");
          navigate("/annonces");
        } else {
          alert("Erreur: " + response.data.message);
        }
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  /* =========================
     PARTAGE
  ========================= */
  const handleShare = () => {
    const url = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: data?.bien?.titre,
        text: "Découvrez ce bien immobilier",
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      alert("Lien copié");
    }
  };

  /* =========================
     GALERIE PHOTOS
  ========================= */
  const openGallery = (piece) => {
    if (!piece?.photos?.length) return;
    setSelectedPiece(piece);
    setPhotoIndex(0);
    setGalleryOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeGallery = () => {
    setGalleryOpen(false);
    setSelectedPiece(null);
    setFullscreen(false);
    document.body.style.overflow = "auto";
  };

  const nextPhoto = () =>
    setPhotoIndex((i) => (i + 1 === selectedPiece.photos.length ? 0 : i + 1));

  const prevPhoto = () =>
    setPhotoIndex((i) => (i === 0 ? selectedPiece.photos.length - 1 : i - 1));

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };

  /* =========================
     LOADING / ERROR
  ========================= */
  if (loading) return <div className={styles.loading}>Chargement…</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  /* =========================
     DATA BACKEND
  ========================= */
  const {
    bien,
    localisation,
    interieur,
    exterieur,
    documents,
    accessibilites,
    commodites,
    conditions_paiement,
    bonus,
    pieces_with_photos,
    video,
  } = data;

  const isTerrain = bien?.type_bien === "Terrain";
  const embedVideo = getEmbedVideo(video);

  return (
    <div className={styles.container}>
      {/* BOUTON RETOUR */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        <FaArrowLeft /> Retour aux annonces
      </button>

      {/* HERO */}
      <div className={styles.hero}>
        {hasData(bien.statut_bien) && (
          <span className={styles.statutBadge}>{bien.statut_bien}</span>
        )}

        <button className={styles.shareBtn} onClick={handleShare}>
          <FaShareAlt /> Partager
        </button>

        {hasData(bien.photo_principale) ? (
          <img src={`${FILE_BASE_URL}${bien.photo_principale}`} alt={bien.titre} />
        ) : (
          <div className={styles.heroPlaceholder}>Aucune photo</div>
        )}
      </div>

      {/* MÉDIAS */}
      <div className={styles.mediaSection}>
        <div className={styles.tabsRow}>
          <button
            className={activeTab === "photos" ? styles.active : ""}
            onClick={() => setActiveTab("photos")}
          >
            <FaImages /> Photos
          </button>

          {embedVideo && (
            <button
              className={activeTab === "video" ? styles.active : ""}
              onClick={() => setActiveTab("video")}
            >
              <FaVideo /> Vidéo
            </button>
          )}
        </div>

        {activeTab === "photos" && hasData(pieces_with_photos) && (
          <>
            {isMobile ? (
              // CARROUSEL MOBILE
              <div className={styles.mobileCarousel}>
                <div className={styles.carouselContainer}>
                  <button className={styles.carouselArrow} onClick={prevSlide}>
                    <FaChevronLeft />
                  </button>
                  
                  <div 
                    className={styles.carouselWrapper}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div 
                      className={styles.carouselTrack}
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {pieces_with_photos.map((piece, index) => (
                        <div key={piece.id_piece} className={styles.carouselSlide}>
                          <div className={styles.pieceFolder} onClick={() => openGallery(piece)}>
                            {piece.photos && piece.photos.length > 0 ? (
                              <div className={styles.piecePhotoPreview}>
                                <img src={`${FILE_BASE_URL}${piece.photos[0]}`} alt={piece.nom_piece} />
                                <div className={styles.photoCountOverlay}>
                                  {piece.photos.length} photo{piece.photos.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            ) : (
                              <div className={styles.pieceIcon}>
                                <FaFolder />
                              </div>
                            )}
                            <h4>{piece.nom_piece}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button className={styles.carouselArrow} onClick={nextSlide}>
                    <FaChevronRight />
                  </button>
                </div>
                
                <div className={styles.carouselIndicators}>
                  {pieces_with_photos.map((_, index) => (
                    <button
                      key={index}
                      className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              // SCROLLABLE DESKTOP
              <div className={styles.piecesScrollable}>
                <button className={styles.scrollArrow} onClick={scrollLeft}>
                  <FaChevronLeft />
                </button>
                <div className={styles.scrollableContainer} ref={scrollRef}>
                  {pieces_with_photos.map((piece) => (
                    <div key={piece.id_piece} className={styles.pieceFolder} onClick={() => openGallery(piece)}>
                      {piece.photos && piece.photos.length > 0 ? (
                        <div className={styles.piecePhotoPreview}>
                          <img src={`${FILE_BASE_URL}${piece.photos[0]}`} alt={piece.nom_piece} />
                          <div className={styles.photoCountOverlay}>
                            {piece.photos.length} photo{piece.photos.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.pieceIcon}>
                          <FaFolder />
                        </div>
                      )}
                      <h4>{piece.nom_piece}</h4>
                    </div>
                  ))}
                </div>
                <button className={styles.scrollArrow} onClick={scrollRight}>
                  <FaChevronRight />
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "video" && embedVideo && (
          <div className={styles.videoContainer}>
            <iframe src={embedVideo.src} title="Vidéo" allowFullScreen className={styles.videoFrame} />
          </div>
        )}
      </div>

      {/* GALERIE MODALE */}
      {galleryOpen && selectedPiece && (
        <div className={`${styles.galleryModal} ${fullscreen ? styles.fullscreen : ''}`}>
          <div className={styles.galleryHeader}>
            <h3>{selectedPiece.nom_piece}</h3>
            <div className={styles.galleryControls}>
              <button onClick={toggleFullscreen} className={styles.fullscreenBtn}>
                {fullscreen ? <FaCompress /> : <FaExpand />}
              </button>
              <button onClick={closeGallery} className={styles.closeBtn}>
                <FaTimes />
              </button>
            </div>
          </div>

          <div className={styles.galleryMain}>
            <button onClick={prevPhoto} className={styles.navBtn}>
              <FaChevronLeft />
            </button>

            <div className={styles.galleryImageContainer}>
              <img
                src={`${FILE_BASE_URL}${selectedPiece.photos[photoIndex]}`}
                alt={`${selectedPiece.nom_piece} - Photo ${photoIndex + 1}`}
                className={styles.galleryImage}
              />
              <div className={styles.photoCounter}>
                {photoIndex + 1} / {selectedPiece.photos.length}
              </div>
            </div>

            <button onClick={nextPhoto} className={styles.navBtn}>
              <FaChevronRight />
            </button>
          </div>

          <div className={styles.galleryThumbnails}>
            {selectedPiece.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setPhotoIndex(index)}
                className={`${styles.thumbnail} ${index === photoIndex ? styles.active : ''}`}
              >
                <img src={`${FILE_BASE_URL}${photo}`} alt={`Miniature ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INFORMATIONS GÉNÉRALES */}
      <div className={styles.card}>
        <h3><FaHome /> Informations générales</h3>
        
        {hasData(bien.titre) && (
          <p className={styles.infoWithIcon}>
            <FaTag className={styles.icon} />
            <strong>Titre :</strong> {bien.titre}
          </p>
        )}
        {hasData(bien.type_bien) && (
          <p className={styles.infoWithIcon}>
            <FaBuilding className={styles.icon} />
            <strong>Type :</strong> {bien.type_bien}
          </p>
        )}
        {hasData(bien.type_offre) && (
          <p className={styles.infoWithIcon}>
            <FaHandshake className={styles.icon} />
            <strong>Offre :</strong> {bien.type_offre}
          </p>
        )}
        {hasData(bien.prix_bien) && (
          <p className={styles.infoWithIcon}>
            <FaEuroSign className={styles.icon} />
            <strong>Prix :</strong> {bien.prix_bien} €
          </p>
        )}
        {hasData(bien.surface) && (
          <p className={styles.infoWithIcon}>
            <FaRulerCombined className={styles.icon} />
            <strong>Surface :</strong> {bien.surface} m²
          </p>
        )}
        
        {!isTerrain && (
          <>
            {hasData(bien.statut) && (
              <p className={styles.infoWithIcon}>
                <FaDoorClosed className={styles.icon} />
                <strong>Statut :</strong> {bien.statut}
              </p>
            )}
            {hasData(bien.meuble) && (
              <p className={styles.infoWithIcon}>
                <FaBed className={styles.icon} />
                <strong>Meublé :</strong> {bien.meuble}
              </p>
            )}
            {hasData(bien.disponibilite) && (
              <p className={styles.infoWithIcon}>
                <FaCalendarAlt className={styles.icon} />
                <strong>Disponibilité :</strong> {bien.disponibilite}
              </p>
            )}
          </>
        )}
        
        {hasData(bien.frais_visite) && (
          <p className={styles.infoWithIcon}>
            <FaEye className={styles.icon} />
            <strong>Frais visite :</strong> {bien.frais_visite}
            {bien.frais_visite === "Oui" && hasData(bien.prix_visite)
              ? ` — ${bien.prix_visite} €`
              : ""}
          </p>
        )}
      </div>

      {/* LOCALISATION */}
      {hasData(localisation) && (
        <div className={styles.card}>
          <h3><FaMapMarkerAlt /> Localisation</h3>
          {hasData(localisation.ville) && (
            <p className={styles.infoWithIcon}>
              <FaCity className={styles.icon} />
              <strong>Ville :</strong> {localisation.ville}
            </p>
          )}
          {hasData(localisation.commune) && (
            <p className={styles.infoWithIcon}>
              <FaBell className={styles.icon} />
              <strong>Commune :</strong> {localisation.commune}
            </p>
          )}
          {hasData(localisation.quartier) && (
            <p className={styles.infoWithIcon}>
              <FaRoad className={styles.icon} />
              <strong>Quartier :</strong> {localisation.quartier}
            </p>
          )}
        </div>
      )}

      {/* DESCRIPTION */}
      {hasData(bien.description) && (
        <div className={styles.card}>
          <h3><FaAlignLeft /> Description</h3>
          <p>{bien.description}</p>
        </div>
      )}

      {/* CARACTÉRISTIQUES INTÉRIEURES */}
      {!isTerrain && hasData(interieur) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaDoorOpen /> Caractéristiques intérieures</h3>
          {interieur.map((item, idx) => (
            <p key={idx}>
              <strong>{item.titre}</strong>
              {hasData(item.description) && ` : ${item.description}`}
            </p>
          ))}
        </div>
      )}

      {/* CARACTÉRISTIQUES EXTÉRIEURES */}
      {hasData(exterieur) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaTree /> Caractéristiques extérieures</h3>
          <div className={styles.badges}>
            {exterieur.map((value, i) => (
              <span key={i} className={styles.badge}>{value}</span>
            ))}
          </div>
        </div>
      )}

      {/* DOCUMENTS */}
      {hasData(documents) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaFileAlt /> Documents</h3>
          <div className={styles.badges}>
            {documents.map((doc, i) => (
              <span key={i} className={styles.badge}>{doc}</span>
            ))}
          </div>
        </div>
      )}

      {/* ACCESSIBILITÉ */}
      {!isTerrain && hasData(accessibilites) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaWheelchair /> Accessibilité</h3>
          <div className={styles.badges}>
            {accessibilites.map((acc, i) => (
              <span key={i} className={styles.badge}>{acc}</span>
            ))}
          </div>
        </div>
      )}

      {/* COMMODITÉS */}
      {hasData(commodites) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaCouch /> Commodités</h3>
          <div className={styles.badges}>
            {commodites.map((com, i) => (
              <span key={i} className={styles.badge}>{com}</span>
            ))}
          </div>
        </div>
      )}

      {/* CONDITIONS DE PAIEMENT */}
      {hasData(conditions_paiement) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaHandshake /> Conditions de paiement</h3>
          <div className={styles.badges}>
            {conditions_paiement.map((cond, i) => (
              <span key={i} className={styles.badge}>{cond}</span>
            ))}
          </div>
        </div>
      )}

      {/* BONUS */}
      {hasData(bonus) && (
        <div className={`${styles.card} ${styles.leftAligned}`}>
          <h3><FaGift /> Bonus</h3>
          <div className={styles.badges}>
            {bonus.map((bon, i) => (
              <span key={i} className={styles.badge}>{bon}</span>
            ))}
          </div>
        </div>
      )}

      {/* BOUTONS ACTION */}
      <div className={styles.actionButtons}>
        <button className={styles.editButton} onClick={handleEdit}>
          <FaEdit /> Modifier l'annonce
        </button>
        <button className={styles.deleteButton} onClick={handleDelete}>
          <FaTrash /> Supprimer l'annonce
        </button>
      </div>
    </div>
  );
}