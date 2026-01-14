import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './accueil.module.css';
import { FaUser, FaHome, FaHandshake, FaBell, FaEnvelope, FaList, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Accueil = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Affiche le message de succès si présent en sessionStorage (une seule fois au montage)
    const msg = window.sessionStorage.getItem("publier_success");
    if (msg) {
      setSuccessMsg(msg);
      window.sessionStorage.removeItem("publier_success");
    }
  }, []);

  useEffect(() => {
    axios.post('http://localhost/plateforme_immobiliere/public/api_dashboard_users/accueil.php', {}, { withCredentials: true })
      .then(res => {
        if (res.data.success) {
          setData(res.data);
        } else {
          const msg = (res.data.message || '').toLowerCase();
          if (msg.includes('non connecté') || msg.includes('non connect')) {
            navigate('/inscription');
            return;
          }
          console.error(res.data.message || "Erreur serveur");
        }
      })
      .catch(err => {
        console.error(err);
        const status = err.response?.status;
        if (status === 401 || status === 403) navigate('/inscription');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.accueilContent}>Chargement...</div>;
  if (!data) return <div className={styles.accueilContent}>Impossible de récupérer les données</div>;

  const { utilisateur, photoProfil, nbAnnonces, nbBiensConclus, notifications = [], messages = [], biens = [] } = data;

  return (
    <div className={styles.accueilContent}>
      {successMsg && (
        <div className={styles.successMsg} style={{marginBottom: 16, color: '#28a745', fontWeight: 'bold', fontSize: '1.1em', background: '#eafbe7', padding: '10px', borderRadius: '6px'}}>
          {successMsg}
        </div>
      )}
      {/* En-tête */}
      <div className={styles.accueilHeader}>
        <h1>Accueil</h1>
        <button
          type="button"
          className={styles.btnCompleterProfil}
          onClick={async () => {
            try {
              const res = await axios.post("http://localhost/plateforme_immobiliere/public/api_dashboard_users/completerProfil.php", {}, { withCredentials: true });
              if (res.data.success && res.data.redirect) {
                navigate(res.data.redirect);
              } else {
                alert(res.data.message || "Impossible de déterminer le type de compte.");
              }
            } catch (err) {
              alert("Erreur serveur ou réseau.");
            }
          }}
        >
          Compléter le profil
        </button>
      </div>

      {/* Profil utilisateur */}
      <section className={styles.profilUtilisateur}>
        <div className={styles.profilPhoto}>
          {photoProfil ? (
            <img src={`http://localhost/plateforme_immobiliere/${photoProfil}`} alt="Photo de profil" />
          ) : (
            <div className={styles.rondVide}><FaUser /></div>
          )}
        </div>
        <div className={styles.profilInfo}>
          <h2>{utilisateur.nom_prenom || utilisateur.nom_agence || 'Utilisateur'}</h2>
          <p className={
            utilisateur.statut === 'verifier' ? styles.verifie :
            utilisateur.statut === 'en attente' ? styles.enAttente :
            styles.nonVerifie
          }>
            {utilisateur.statut === 'verifier' ? (
              <><FaCheckCircle style={{ color: '#28a745', marginRight: '6px' }} /> Compte vérifié</>
            ) : utilisateur.statut === 'en attente' ? (
              <><FaClock style={{ color: '#ff9900', marginRight: '6px' }} /> En attente de validation</>
            ) : (
              <><FaExclamationTriangle style={{ color: '#e74c3c', marginRight: '6px' }} /> Profil incomplet</>
            )}
          </p>
        </div>
      </section>

      {/* Statistiques */}
      <section className={styles.statsSection}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><FaHome /></div>
          <div className={styles.statInfo}>
            <h3>{nbAnnonces}</h3>
            <p>Annonces publiées</p>
          </div>
        </div>
        <div className={`${styles.statCard} ${styles.statIconConclu}`}>
          <div className={`${styles.statIcon} ${styles.statIconConclu}`}><FaHandshake /></div>
          <div className={styles.statInfo}>
            <h3>{nbBiensConclus}</h3>
            <p>Biens conclus</p>
          </div>
        </div>
      </section>

      {/* Notifications & messages */}
      <section className={styles.infoSection}>
        <div className={styles.notifications}>
          <h3><FaBell /> Dernières notifications</h3>
          {notifications.length > 0 ? (
            <ul>
              {notifications.map((notif, idx) => (
                <li key={idx}>
                  <p>{notif.contenu}</p>
                  <span className={styles.date}>{new Date(notif.date_notification).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>Aucune notification pour le moment.</p>}
        </div>
        <div className={styles.messages}>
          <h3><FaEnvelope /> Derniers messages</h3>
          {messages.length > 0 ? (
            <ul>
              {messages.map((msg, idx) => (
                <li key={idx}>
                  <strong>{msg.nom_expediteur}</strong>
                  <p>{msg.contenu}</p>
                  <span className={styles.date}>{new Date(msg.date_message).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          ) : <p className={styles.empty}>Aucun message reçu pour le moment.</p>}
        </div>
      </section>

      {/* Dernières annonces */}
      <section className={styles.sectionAnnonces}>
        <h3><FaList /> Mes dernières annonces publiées</h3>
        {biens.length > 0 ? (
          <div className={styles.grilleAnnonces}>
            {biens.map(bien => (
              <div key={bien.id_bien} className={styles.carteBien}>
                <img src={bien.photo_principale} alt={bien.titre} />
                <div className={styles.infosBien}>
                  <h4>{bien.titre}</h4>
                  <a href={`/details_bien/${bien.id_bien}`} className={styles.btnDetails}>Voir détails</a>
                  <p className={
                    bien.statut_bien === 'publie' ? styles.etatPublie :
                    bien.statut_bien === 'suspendre' ? styles.etatSuspendu :
                    bien.statut_bien === 'supprime' ? styles.etatSupprime :
                    styles.etatAttente
                  }>
                    {bien.statut_bien}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className={styles.aucuneAnnonce}>Aucune annonce publiée pour le moment.</p>}
      </section>
    </div>
  );
};

export default Accueil;
