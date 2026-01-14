import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navbar';
import styles from './dashboardLayout.module.css';
import { FaBars, FaSearch, FaUserCircle } from 'react-icons/fa';
import logo from '../../assets/logo/logo_immo.jpeg';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Empêcher le scroll du body quand la sidebar est ouverte sur mobile
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Fermer avec la touche Échap
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && sidebarOpen) setSidebarOpen(false);
  }, [sidebarOpen]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  return (
    <div className={`${styles.wrapper} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Overlay mobile */}
      <button
        className={styles.mobileOverlay}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        aria-label="Fermer le menu"
        style={{ display: sidebarOpen ? undefined : 'none' }}
      />

      <div className={styles.contentArea} aria-hidden={sidebarOpen ? true : false}>
        <a 
          className={styles.skipLink} 
          href="#mainContent"
          aria-label="Passer la navigation et aller directement au contenu principal"
        >
          Aller au contenu
        </a>

        {/* Header */}
        <header className={styles.header}>
          
          {/* GAUCHE */}
          <div className={styles.headerLeft}>
            <button
              className={styles.hamburger}
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <FaBars />
            </button>

            <img
              src={logo}
              alt="Logo Plateforme Immobilière"
              className={styles.logo}
              loading="lazy"
            />

            <h1 className={styles.pageTitle}>Dashboard</h1>
          </div>

          {/* CENTRE (nouveau – pour le centrage propre) */}
          <div className={styles.headerCenter}>
            <form
              className={styles.searchBox}
              role="search"
              aria-label="Recherche de propriétés immobilières"
              onSubmit={(e) => {
                e.preventDefault();
                console.log('Recherche soumise');
              }}
            >
              <div className={styles.searchInputContainer}>
                <input
                  type="search"
                  name="search"
                  placeholder="Recherche par ville, quartier, région, adresse ou code Centris"
                  className={styles.searchInput}
                  aria-label="Recherche de propriétés"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className={styles.searchSubmitButton}
                aria-label="Lancer la recherche"
              >
                <FaSearch aria-hidden="true" />
              </button>
            </form>
          </div>

          {/* DROITE */}
          <div className={styles.headerRight}>
            <button
              className={styles.profileBtn}
              aria-label="Ouvrir le menu utilisateur"
              aria-haspopup="true"
              onClick={() => {}}
            >
              <FaUserCircle aria-hidden="true" />
            </button>
          </div>

        </header>

        <main id="mainContent" className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
