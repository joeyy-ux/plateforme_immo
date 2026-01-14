// src/components/Sidebar.jsx
import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './navbar.module.css';
import {
  FaUser, FaHome, FaClipboardList, FaPlusSquare, FaHistory,
  FaBell, FaFileAlt, FaCreditCard, FaCog,
  FaHeadset, FaSignOutAlt, FaCheckCircle, FaClock, FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_users';

const navItems = [
  { to: '/dashboard/accueil', icon: <FaHome />, label: 'Accueil' },
  { to: '/dashboard/annonces', icon: <FaClipboardList />, label: 'Mes annonces' },
  { to: '/dashboard/publie_annonce', icon: <FaPlusSquare />, label: 'Publier une annonce' },
  { to: '/dashboard/historique_annonce', icon: <FaHistory />, label: 'Historique' },
  { to: '/dashboard/notification', icon: <FaBell />, label: 'Notification' },
  { to: '/dashboard/contrat', icon: <FaFileAlt />, label: 'Contrat' },
  { to: '/dashboard/paiement', icon: <FaCreditCard />, label: 'Paiement' },
  { to: '/dashboard/parametre', icon: <FaCog />, label: 'Paramètre' },
  { to: '/dashboard/support', icon: <FaHeadset />, label: 'Support client' },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyLogout, setBusyLogout] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const abortRef = useRef(null);
  const nodeRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const res = await axios.post(`${API_BASE}/navbar.php`, {}, {
          withCredentials: true,
          signal: controller.signal,
          timeout: 9000,
        });

        if (res.data?.success) {
          setUser(res.data.user);
        } else {
          const msg = (res.data?.message || '').toLowerCase();
          console.warn('navbar response:', res.data);
          if (res.status === 401 || msg.includes('non connecté') || msg.includes('non connect')) {
            navigate('/inscription', { replace: true });
          }
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error('Erreur fetch navbar:', err?.response?.data || err.message || err);
        const status = err.response?.status;
        if (status === 401 || status === 403) navigate('/inscription', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    return () => controller.abort();
  }, [navigate]);

  const handleLogout = async (e) => {
    e && e.preventDefault();
    if (busyLogout) return;
    setBusyLogout(true);
    try {
      const res = await axios.post(`${API_BASE}/logout.php`, {}, {
        withCredentials: true,
        timeout: 7000,
      });
      if (res.data?.success) {
        setUser(null);
        navigate('/inscription', { replace: true });
      } else {
        console.warn('Logout failed:', res.data);
      }
    } catch (err) {
      console.error('Logout error:', err?.response?.data || err.message || err);
    } finally {
      setBusyLogout(false);
    }
  };

  const avatarOnError = (e) => {
    e.currentTarget.style.display = 'none';
  };

  // focus first focusable when opening
  useEffect(() => {
    if (isOpen && nodeRef.current) {
      const focusable = nodeRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable) focusable.focus();
    }
  }, [isOpen]);

  // poll unread notifications count
  useEffect(() => {
    let mounted = true;
    let intervalId = null;

    const fetchCount = async () => {
      try {
        const res = await axios.get(`${API_BASE}/get_unread_count.php`, {
          withCredentials: true,
          timeout: 8000,
        });
        if (!mounted) return;
        const c = Number(res.data?.count ?? 0);
        setUnreadCount(c);
      } catch (err) {
        // silent - don't spam console in normal flow
        console.debug('fetch unread count err', err?.response?.data || err.message || err);
      }
    };

    fetchCount();
    intervalId = setInterval(fetchCount, 15000);
    return () => { mounted = false; if (intervalId) clearInterval(intervalId); };
  }, []);

  // update unread count immediately when notifications change elsewhere
  useEffect(() => {
    const handler = async () => {
      try {
        const res = await axios.get(`${API_BASE}/get_unread_count.php`, { withCredentials: true, timeout: 8000 });
        const c = Number(res.data?.count ?? 0);
        setUnreadCount(c);
      } catch (err) {
        console.debug('notifications:update handler err', err?.response?.data || err.message || err);
      }
    };
    window.addEventListener('notifications:update', handler);
    return () => window.removeEventListener('notifications:update', handler);
  }, []);

  // click outside closes (mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isOpen) return;
      if (nodeRef.current && !nodeRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (loading && !user) {
    return (
      <nav id="sidebar" className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} aria-label="Sidebar" ref={nodeRef}>
        <div className={styles.loading}>Chargement...</div>
      </nav>
    );
  }

  return (
    <nav
      id="sidebar"
      className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}
      aria-label="Navigation principale"
      ref={nodeRef}
    >
      {/* close button (mobile only when open) */}
      <button
        className={styles.closeBtn}
        onClick={onClose}
        aria-label="Fermer le menu"
        type="button"
      >
        <FaTimes aria-hidden="true" />
      </button>

      <div className={styles.profileWrap}>
        <div className={styles.avatar}>
          {user?.photo ? (
            <img src={user.photo} alt={`${user.nom || 'Utilisateur'} - avatar`} onError={avatarOnError} />
          ) : (
            <div className={styles.rondVide}><FaUser aria-hidden="true" /></div>
          )}
        </div>

        <div className={styles.userName}>{user?.nom || 'Utilisateur'}</div>

        <div className={styles.statusRow}>
          {user?.statut === 'verifier' ? (
            <div className={`${styles.statusBadge} ${styles['status-verified']}`}>
              <FaCheckCircle aria-hidden="true" /> Compte vérifié
            </div>
          ) : user?.statut === 'en attente' ? (
            <div className={`${styles.statusBadge} ${styles['status-pending']}`}>
              <FaClock aria-hidden="true" /> En attente
            </div>
          ) : (
            <div className={`${styles.statusBadge} ${styles['status-incomplete']}`}>
              <FaExclamationTriangle aria-hidden="true" /> Profil incomplet
            </div>
          )}
        </div>
      </div>

      <div className={styles.nav}>
        {navItems.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            onClick={() => { if (isOpen) onClose(); }}
          >
            <span className={styles.iconPill} aria-hidden="true">{it.icon}
              {it.to === '/dashboard/notification' && unreadCount > 0 && (
                <span className={styles.notifBadge} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </span>
            <span className={styles.label}>{it.label}</span>
          </NavLink>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          className={styles.logoutBtn}
          onClick={(e) => { handleLogout(e); if (isOpen) onClose(); }}
          disabled={busyLogout}
          aria-disabled={busyLogout}
          aria-label="Se déconnecter"
        >
          <FaSignOutAlt aria-hidden="true" />
          <span>{busyLogout ? 'Déconnexion...' : 'Déconnexion'}</span>
        </button>

        <small>v1.0 — Plateforme</small>
      </div>
    </nav>
  );
};

export default Sidebar;
