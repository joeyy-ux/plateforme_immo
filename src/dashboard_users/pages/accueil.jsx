// src/pages/Accueil.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './accueil.module.css';
import {
  FaHome,
  FaHandshake,
  FaBell,
  FaFileAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import SuccessCard from './SuccessCard';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_users';


export default function Accueil() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successCard, setSuccessCard] = useState(null);
  const [busyCompleter, setBusyCompleter] = useState(false);
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const autoDismissRef = useRef(null);
  const carouselRef = useRef(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [maxScroll, setMaxScroll] = useState(0);


  // ============================================
  // EFFETS ET CHARGEMENT DES DONNÉES
  // ============================================
  useEffect(() => {
    const msg = window.sessionStorage.getItem('completerProfil_success');
    if (msg) {
      setSuccessCard(msg);
      window.sessionStorage.removeItem('completerProfil_success');
    }

    const onProfileCompleted = () => {
      const m = window.sessionStorage.getItem('completerProfil_success');
      if (m) {
        setSuccessCard(m);
        window.sessionStorage.removeItem('completerProfil_success');
      }
    };
    window.addEventListener('profile-completed', onProfileCompleted);

    const controller = new AbortController();
    abortRef.current = controller;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.post(`${API_BASE}/accueil.php`, {}, {
          withCredentials: true,
          signal: controller.signal,
          timeout: 9000,
        });

        if (res?.data?.success) {
          setData(res.data);
        } else {
          const msgLower = (res?.data?.message || '').toLowerCase();
          if (msgLower.includes('non connecté') || msgLower.includes('non connect')) {
            navigate('/inscription', { replace: true });
            return;
          }
          setError(res?.data?.message || 'Réponse serveur invalide.');
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          navigate('/inscription', { replace: true });
          return;
        }
        setError('Impossible de contacter le serveur.');
        console.error('Erreur accueil fetch:', err?.response?.data ?? err);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      try {
        if (abortRef.current && typeof abortRef.current.abort === 'function') {
          abortRef.current.abort();
        }
      } catch (_) {}
      window.removeEventListener('profile-completed', onProfileCompleted);
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [navigate]);

  useEffect(() => {
    if (!successCard) return;
    if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    autoDismissRef.current = setTimeout(() => {
      setSuccessCard(null);
      autoDismissRef.current = null;
    }, 4500);

    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
        autoDismissRef.current = null;
      }
    };
  }, [successCard]);

  const dismissSuccessCard = () => setSuccessCard(null);

  // ============================================
  // GESTION DU CARROUSEL
  // ============================================
  const scrollCarousel = (direction) => {
    if (!carouselRef.current) return;
    
    const container = carouselRef.current;
    const cardWidth = 320; // Largeur approximative d'une carte
    const scrollAmount = cardWidth;
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mettre à jour la position de scroll
  useEffect(() => {
    const container = carouselRef.current;
    if (!container) return;

    const updateScrollPosition = () => {
      setScrollPosition(container.scrollLeft);
      setMaxScroll(container.scrollWidth - container.clientWidth);
    };

    container.addEventListener('scroll', updateScrollPosition);
    updateScrollPosition(); // Initial update

    return () => container.removeEventListener('scroll', updateScrollPosition);
  }, [data]); // Re-run when data changes

  // ============================================
  // GESTION "COMPLÉTER MON PROFIL"
  // ============================================
  const handleCompleterProfil = async (e) => {
    e?.preventDefault?.();
    if (busyCompleter) return;
    setBusyCompleter(true);

    try {
      const res = await axios.post(`${API_BASE}/completerProfil.php`, {}, {
        withCredentials: true,
        timeout: 10000,
      });

      if (res?.data?.redirect) {
        navigate(res.data.redirect);
      }
    } finally {
      setBusyCompleter(false);
    }
  };

  // ============================================
  // ÉTATS DE CHARGEMENT ET ERREUR
  // ============================================
  if (loading) return (
    <div className={styles.wrapper}>
      <div className={styles.loader}>
        <div className={styles.spinner}></div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={styles.wrapper}>
      <div className={styles.errorBanner}>
        <FaExclamationTriangle />
        <span>{error}</span>
      </div>
    </div>
  );

  if (!data) return (
    <div className={styles.wrapper}>
      <div className={styles.errorBanner}>
        <FaExclamationTriangle />
        <span>Aucune donnée disponible.</span>
      </div>
    </div>
  );

  // ============================================
  // EXTRACTION DES DONNÉES
  // ============================================
  const {
    utilisateur = {},
    photoProfil = '',
    nbAnnonces = 0,
    nbBiensConclus = 0,
    notifications = [],
    unreadNotifications = 0,
    biens = []
  } = data;

  const statut = (utilisateur.statut || '').toLowerCase();

  // ============================================
  // COMPOSANTS DE STATUT
  // ============================================
  const StatusIcon = () => {
    switch (statut) {
      case 'verifier':
        return <FaCheckCircle className={styles.statusIcon} />;
      case 'en attente':
        return <FaClock className={styles.statusIcon} />;
      default:
        return <FaExclamationTriangle className={styles.statusIcon} />;
    }
  };

  const StatusText = () => {
    switch (statut) {
      case 'verifier':
        return 'Compte vérifié';
      case 'en attente':
        return 'En attente de vérification';
      default:
        return 'Profil incomplet';
    }
  };

  // ============================================
  // RENDU PRINCIPAL
  // ============================================
  return (
    <div className={styles.wrapper}>
      {/* Carte de succès */}
      {successCard && (
        <SuccessCard message={successCard} onClose={dismissSuccessCard} />
      )}

      {/* ================= HERO ================= */}
      <header className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarWrap}>
            {photoProfil ? (
              <img
                className={styles.avatarImg}
                src={photoProfil}
                alt={`Photo de profil de ${utilisateur.nom_prenom || 'utilisateur'}`}
                loading="lazy"
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {(utilisateur.nom_prenom || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className={styles.heroInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.username}>
                {utilisateur.nom_prenom ?? utilisateur.nom_agence ?? 'Utilisateur'}
              </h1>
            </div>

            <div className={styles.statusRow}>
              <div
                className={`${styles.statusBadge} ${
                  statut === 'verifier'
                    ? styles.statusVerified
                    : statut === 'en attente'
                    ? styles.statusPending
                    : styles.statusIncomplete
                }`}
              >
                <StatusIcon />
                <span>{StatusText()}</span>
              </div>

              <div className={styles.progressContainer}>
                <div className={styles.progressLabel}>
                  Complétion du profil: <strong>{utilisateur.progress ?? 24}%</strong>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${utilisateur.progress ?? 24}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.heroRight}>
          {!(statut === 'verifier' || statut === 'en attente') && (
            <button
              className={styles.primaryBtn}
              onClick={handleCompleterProfil}
              disabled={busyCompleter}
            >
              {busyCompleter ? 'Chargement...' : 'Compléter mon profil'}
            </button>
          )}
        </div>
      </header>

      {/* ================= KPI ================= */}
      <section className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><FaHome /></div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiNumber}>{nbAnnonces}</div>
            <div className={styles.kpiLabel}>Annonces publiées</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><FaHandshake /></div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiNumber}>{nbBiensConclus}</div>
            <div className={styles.kpiLabel}>Biens conclus</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><FaFileAlt /></div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiNumber}>{unreadNotifications || notifications.length}</div>
            <div className={styles.kpiLabel}>Notifications</div>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiIcon}><FaChartLine /></div>
          <div className={styles.kpiContent}>
            <div className={styles.kpiNumber}>{biens.length}</div>
            <div className={styles.kpiLabel}>Annonces actives</div>
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className={styles.ctaSection}>
        <h2 className={styles.sectionTitle}>Actions rapides</h2>
        <div className={styles.ctaGrid}>
          <button className={styles.ctaPrimary} onClick={() => navigate('/dashboard/publie_annonce')}>
            <FaHome /><span>Publier une annonce</span>
          </button>

          <button className={styles.ctaSecondary} onClick={() => navigate('/dashboard/annonces')}>
            <FaFileAlt /><span>Gérer mes annonces</span>
          </button>

          <button className={styles.ctaTertiary} onClick={() => navigate('/dashboard/historique_annonce')}>
            <FaChartLine /><span>Voir l'historique</span>
          </button>
        </div>
      </section>

      {/* ================= CONTENU ================= */}
      <section className={styles.contentGrid}>
        {/* NOTIFICATIONS */}
        <article className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <FaBell />
            <h3>Dernières notifications</h3>
            { (unreadNotifications || notifications.length) > 0 && (
              <span className={styles.badge}>{unreadNotifications || notifications.length}</span>
            )}
          </div>

          <div className={styles.cardBody}>
            {notifications.length > 0 ? (
              <ul className={styles.list}>
                {notifications.slice(0, 5).map((n, i) => (
                  <li key={n.id_notification ?? i} className={styles.listItem}>
                    <div className={styles.listContent}>
                      <div className={styles.listText}>{n.contenu ?? n.message}</div>
                      <div className={styles.listMeta}>
                        {n.date_notification
                          ? new Date(n.date_notification).toLocaleDateString('fr-FR')
                          : ''}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <FaBell className={styles.emptyIcon} />
                <p>Aucune notification pour le moment</p>
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className={styles.cardFooter}>
              <button
                className={styles.viewMoreBtn}
                onClick={() => navigate('/dashboard/notification')}
              >
                Voir toutes les notifications ({notifications.length})
              </button>
            </div>
          )}
        </article>

        {/* ANNONCES */}
        <article className={`${styles.card} ${styles.fullWidth}`}>
          <div className={styles.cardHeader}>
            <FaHome />
            <h3>Dernières annonces publiées</h3>
            {biens.length > 0 && (
              <span className={styles.badge}>{biens.length}</span>
            )}
          </div>

          <div className={styles.cardBody}>
            {biens.length > 0 ? (
              <div className={styles.annoncesCarousel}>
                <button 
                  className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
                  onClick={() => scrollCarousel('left')}
                  disabled={scrollPosition === 0}
                >
                  <FaChevronLeft />
                </button>
                
                <div className={styles.carouselContainer} ref={carouselRef}>
                  <div className={styles.carouselTrack}>
                    {biens.map((b, i) => {
                      const photo = b.photo_principale && b.photo_principale.trim() !== ""
                        ? `http://localhost/plateforme_immobiliere/${b.photo_principale}`
                        : "https://via.placeholder.com/300x200?text=Photo";
                      
                      const statut = (b.statut_bien || "attente").toLowerCase();
                      const statutClass = statut === "publie" ? styles.statutPublie : 
                                        statut === "suspendre" ? styles.statutSuspendu : styles.statutAttente;
                      const statutLabel = statut === "publie" ? "Publié" : 
                                        statut === "suspendre" ? "Suspendu" : "En attente";

                      return (
                        <div key={b.id_bien ?? i} className={styles.annonceCard}>
                          <div className={styles.cardImage}>
                            <img src={photo} alt={b.titre || 'Annonce'} loading="lazy" />
                            <span className={`${styles.cardStatut} ${statutClass}`}>
                              {statutLabel}
                            </span>
                          </div>
                          
                          <div className={styles.cardContent}>
                            <h4 className={styles.cardTitle}>{b.titre ?? 'Annonce sans titre'}</h4>
                            
                            <div className={styles.cardInfo}>
                              <p className={styles.cardType}>
                                <strong>Type de bien :</strong> {b.type_bien ?? 'Type non spécifié'}
                              </p>
                              <p className={styles.cardLocation}>
                                <strong>Ville :</strong> {b.ville ?? 'Localisation non spécifiée'}
                              </p>
                              {b.prix && (
                                <p className={styles.cardPrice}>
                                  <strong>Prix :</strong> {b.prix} FCFA
                                </p>
                              )}
                            </div>
                            
                            <button 
                              className={styles.cardDetailsBtn}
                              onClick={() => navigate(`/dashboard/annonces/${b.id_bien}`)}
                            >
                              Voir détails
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button 
                  className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
                  onClick={() => scrollCarousel('right')}
                  disabled={scrollPosition >= maxScroll}
                >
                  <FaChevronRight />
                </button>
              </div>
            ) : (
              <div className={styles.emptyState}>
                <FaHome className={styles.emptyIcon} />
                <p>Vous n'avez pas encore publié d'annonce</p>
                <button
                  className={styles.emptyAction}
                  onClick={() => navigate('/dashboard/publie_annonce')}
                >
                  Publier ma première annonce
                </button>
              </div>
            )}
          </div>

          {biens.length > 0 && (
            <div className={styles.cardFooter}>
              <button
                className={styles.viewMoreBtn}
                onClick={() => navigate('/dashboard/annonces')}
              >
                Voir toutes les annonces ({biens.length})
              </button>
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
