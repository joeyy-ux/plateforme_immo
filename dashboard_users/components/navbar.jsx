import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './navbar.module.css';
import { FaUser, FaHome, FaClipboardList, FaPlusSquare, FaHistory, FaEnvelope, FaBell, FaFileAlt, FaCreditCard, FaCog, FaHeadset, FaSignOutAlt, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';

const Sidebar = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.post('http://localhost/plateforme_immobiliere/src/public/api_dashboard_users/navbar.php', {}, { withCredentials: true })
      .then(res => {
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          const msg = (res.data.message || '').toLowerCase();
          if (msg.includes('non connecté') || msg.includes('non connect')) {
            navigate('/inscription');
            return;
          }
          console.error(res.data.message);
        }
      })
      .catch(err => {
        console.error(err);
        const status = err.response?.status;
        if (status === 401 || status === 403) navigate('/inscription');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <nav className={styles.sidebar}>Chargement...</nav>;

  return (
    <nav className={styles.sidebar}>
      <div className={styles.userProfile}>
        <div className={styles.userAvatar}>
          {user?.photo ? (
            <img src={`http://localhost/plateforme_immobiliere/${user.photo}`} alt="Photo utilisateur" />
          ) : (
            <div className={styles.rondVide}><FaUser /></div>
          )}
        </div>
        <div className={styles.userStatus}>
          {user?.statut === 'verifier' ? (
            <><FaCheckCircle style={{ color: '#28a745', marginRight: '6px' }} />Compte vérifié</>
          ) : user?.statut === 'en attente' ? (
            <><FaClock style={{ color: '#ff9900', marginRight: '6px' }} />En attente de validation</>
          ) : (
            <><FaExclamationTriangle style={{ color: '#e74c3c', marginRight: '6px' }} />Profil incomplet</>
          )}
        </div>
      </div>

      <ul className={styles.menu}>
        <li><NavLink to="/dashboard/accueil" className={({isActive}) => isActive ? styles.active : ''}><i><FaHome /> Accueil</i></NavLink></li>
        <li><NavLink to="/dashboard/annonces" className={({isActive}) => isActive ? styles.active : ''}><i><FaClipboardList /> Mes annonces</i></NavLink></li>
        <li><NavLink to="/dashboard/publie_annonce" className={({isActive}) => isActive ? styles.active : ''}><i><FaPlusSquare /> Publier une annonce</i></NavLink></li>
        <li><NavLink to="/dashboard/historique_annonce" className={({isActive}) => isActive ? styles.active : ''}><i><FaHistory /> Historique des annonces</i></NavLink></li>
        <li><NavLink to="/dashboard/messagerie" className={({isActive}) => isActive ? styles.active : ''}><i><FaEnvelope /> Messagerie</i></NavLink></li>
        <li><NavLink to="/dashboard/notification" className={({isActive}) => isActive ? styles.active : ''}><i><FaBell /> Notification</i></NavLink></li>
        <li><NavLink to="/dashboard/contrat" className={({isActive}) => isActive ? styles.active : ''}><i><FaFileAlt /> Contrat</i></NavLink></li>
        <li><NavLink to="/dashboard/paiement" className={({isActive}) => isActive ? styles.active : ''}><i><FaCreditCard /> Paiement</i></NavLink></li>
        <li><NavLink to="/dashboard/parametre" className={({isActive}) => isActive ? styles.active : ''}><i><FaCog /> Paramètre</i></NavLink></li>
        <li><NavLink to="/dashboard/support" className={({isActive}) => isActive ? styles.active : ''}><i><FaHeadset /> Support client</i></NavLink></li>
        <li className={styles.logout}><NavLink to="/logout"><i><FaSignOutAlt /> Déconnexion</i></NavLink></li>
      </ul>
    </nav>
  );
};

export default Sidebar;
