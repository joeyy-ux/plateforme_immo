import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/navbar';
import styles from './adminLayout.module.css';
import { FaSearch, FaBell, FaBars } from 'react-icons/fa';
import logo from '../../assets/logo/logo_immo.jpeg';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

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

      <div className={styles.content} aria-hidden={sidebarOpen ? true : false}>
        {/* Header */}
        <header className={styles.header}>

          <div className={styles.headerLeft}>
            <button
              className={styles.hamburger}
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-controls="sidebar"
              aria-label={sidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            ><FaBars /></button>

            <img src={logo} alt="Logo" className={styles.logo} />
          </div>

          <div className={styles.headerCenter}>
            <form className={styles.searchForm} role="search" onSubmit={(e)=>e.preventDefault()}>
              <input className={styles.searchInput} placeholder="Rechercher utilisateur, bien, ville..." aria-label="Recherche" />
              <button className={styles.searchBtn} aria-label="search"><FaSearch /></button>
            </form>
          </div>

          <div className={styles.headerRight}>
            <button className={styles.iconBtn} title="Notifications"><FaBell /></button>
            <div className={styles.profileName}>Tableau de bord — Administration</div>
          </div>

        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
