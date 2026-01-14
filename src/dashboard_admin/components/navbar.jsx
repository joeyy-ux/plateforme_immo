import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import styles from './navbar.module.css';
import { FaHome, FaUserCheck, FaUsers, FaBuilding, FaClipboardList, FaHandshake, FaSignOutAlt } from 'react-icons/fa';

const nav = [
  { to: '/admin/accueil', label: 'Accueil', icon: <FaHome /> },
  { to: '/admin/inscriptions-incompletes', label: "Inscription incomplète", icon: <FaClipboardList /> },
  { to: '/admin/utilisateurs-en-attente', label: "Utilisateurs en attente", icon: <FaUserCheck /> },
  { to: '/admin/utilisateurs-actifs', label: "Utilisateurs actifs", icon: <FaUsers /> },
  { to: '/admin/gestion-biens', label: "Gestion des biens", icon: <FaBuilding /> },
  { to: '/admin/demandes-visite', label: "Demande de visite", icon: <FaClipboardList /> },
  { to: '/admin/transactions', label: "Transaction", icon: <FaHandshake /> },
];

const AdminNavbar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('/public/api_authentification/deconnexion.php', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // silence — fallback to client redirect
    }
    navigate('/connexion');
  };

  return (
    <aside id="sidebar" className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Navigation admin">
      <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer le menu">✕</button>
      <div className={styles.profile}>
        <div className={styles.avatar} aria-hidden>
          <div style={{color:'#fff',fontWeight:800}}>ADMIN</div>
        </div>
        <div className={styles.name}>admin</div>
        <div className={styles.role}>Administrateur</div>
      </div>

      <nav className={styles.nav} role="navigation" aria-label="Menu admin">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={({isActive}) => `${styles.item} ${isActive?styles.active:''}`}>
            <span className={styles.icon} aria-hidden>{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Déconnexion">
          <FaSignOutAlt /> <span>Déconnexion</span>
        </button>
        <div className={styles.small}>Tableau de bord — Admin</div>
      </div>
    </aside>
  );
};

export default AdminNavbar;
