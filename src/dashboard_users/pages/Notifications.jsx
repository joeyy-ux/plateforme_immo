import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaBell } from 'react-icons/fa';
import styles from './notif.module.css';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_users';

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/list_notifications.php?page=${p}&per_page=${perPage}`, { withCredentials: true });
      console.debug('list_notifications response', res?.data);
      if (res.data?.success) {
        setItems(res.data.notifications || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || p);
      } else {
        setItems([]);
        setTotal(0);
        // show server message as empty item so user sees something
        if (res.data?.message) {
          setItems([]);
          console.warn('list_notifications message:', res.data.message);
        }
      }
    } catch (err) {
      console.error('load notifications', err?.response?.data || err.message || err);
      // expose error to user by setting items to contain the error
      setItems([]);
      setTotal(0);
      // add a non-readable console element by setting an empty item? keep simple — log only
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  const markRead = async (id) => {
    try {
      await axios.post(`${API_BASE}/mark_read.php`, { id }, { withCredentials: true });
      // update local state
      setItems((s) => s.map(it => it.id_notification === id ? { ...it, is_read: 1 } : it));
      // notify others (navbar) to refresh badge immediately
      try { window.dispatchEvent(new CustomEvent('notifications:update')); } catch (e) { /* ignore */ }
    } catch (err) {
      console.error('mark read', err?.response?.data || err.message || err);
    }
  };

  const markAllRead = async () => {
    const ids = items.filter(i => !i.is_read).map(i => i.id_notification);
    if (ids.length === 0) return;
    try {
      await axios.post(`${API_BASE}/mark_read.php`, { ids }, { withCredentials: true });
      setItems((s) => s.map(it => ({ ...it, is_read: 1 })));
      try { window.dispatchEvent(new CustomEvent('notifications:update')); } catch (e) {}
    } catch (err) {
      console.error('mark all read', err?.response?.data || err.message || err);
    }
  };

  const deleteOne = async (id) => {
    if (!window.confirm('Supprimer cette notification ?')) return;
    try {
      await axios.post(`${API_BASE}/delete_notification.php`, { id }, { withCredentials: true });
      setItems((s) => s.filter(it => it.id_notification !== id));
      try { window.dispatchEvent(new CustomEvent('notifications:update')); } catch (e) {}
    } catch (err) {
      console.error('delete notification', err?.response?.data || err.message || err);
    }
  };

  const deleteAll = async () => {
    if (!window.confirm('Supprimer toutes les notifications ?')) return;
    const ids = items.map(i => i.id_notification);
    if (ids.length === 0) return;
    try {
      await axios.post(`${API_BASE}/delete_notification.php`, { ids }, { withCredentials: true });
      setItems([]);
      try { window.dispatchEvent(new CustomEvent('notifications:update')); } catch (e) {}
    } catch (err) {
      console.error('delete all notifications', err?.response?.data || err.message || err);
    }
  };

  const onToggle = async (n) => {
    const id = n.id_notification;
    // if not read, mark as read
    if (!n.is_read) await markRead(id);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.header}><h2><FaBell /> Notifications</h2></header>
      <main>
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8, gap:8}}>
              <div style={{display:'flex', gap:8}}>
                {items.some(i => !i.is_read) && (
                  <button onClick={markAllRead} style={{background:'#e2433a', color:'#fff', padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer'}}>Marquer tout comme lu</button>
                )}
                {items.length > 0 && (
                  <button onClick={deleteAll} style={{background:'#666', color:'#fff', padding:'6px 10px', borderRadius:8, border:'none', cursor:'pointer'}}>Supprimer tout</button>
                )}
              </div>
              <div />
            </div>
            <ul className={styles.list}>
              {items.length === 0 && <li className={styles.empty}>Aucune notification</li>}
              {items.map(n => (
                <li key={n.id_notification} className={styles.item} style={{opacity: n.is_read ? 0.85 : 1}}>
                  <div onClick={() => onToggle(n)} style={{cursor:'pointer'}}>
                    <div className={styles.title}>
                      {n.titre}
                      {!n.is_read && <span style={{color:'#e2433a', fontWeight:800, marginLeft:8}}>●</span>}
                    </div>
                    <div className={styles.meta}>{n.date_notification ? new Date(n.date_notification).toLocaleString() : ''}</div>
                    {expandedId === n.id_notification && (
                      <div className={styles.message} style={{marginTop:8}}>{n.contenu}</div>
                    )}
                  </div>
                  <div style={{marginTop:8, display:'flex', gap:8}}>
                    <button onClick={() => onToggle(n)} style={{padding:'6px 10px'}}>Voir</button>
                    <button onClick={() => deleteOne(n.id_notification)} style={{padding:'6px 10px', background:'#e2433a', color:'#fff', border:'none', borderRadius:6}}>Supprimer</button>
                  </div>
                </li>
              ))}
            </ul>

            {/* simple pagination controls */}
            {total > perPage && (
              <div style={{marginTop:12, display:'flex', gap:8}}>
                <button disabled={page <= 1} onClick={() => load(page - 1)}>Préc.</button>
                <div style={{alignSelf:'center'}}>Page {page} / {Math.ceil(total / perPage)}</div>
                <button disabled={page >= Math.ceil(total / perPage)} onClick={() => load(page + 1)}>Suiv.</button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
