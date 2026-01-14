import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import styles from './Accueil.module.css';
import { FaClipboardList, FaUsers, FaHourglassHalf, FaCheckCircle, FaEnvelope, FaHome } from 'react-icons/fa';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const APP_BASE = 'http://localhost/plateforme_immo/';

const AccueilAdmin = () => {
  const [stats, setStats] = useState({ biens: 0, recent: [], topUsers: [], usersActive: 0, usersPending: 0, biensConclu: 0 });
  const [loading, setLoading] = useState(true);
  // No monthly trend required per admin preference
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageTarget, setMessageTarget] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  // recalc removed per admin preference
  const messageRef = useRef(null);

  useEffect(()=>{ fetchDashboard(); }, []);

  async function fetchDashboard(){
    setLoading(true);
    try{
      // get biens (use per_page small to obtain total + few recent)
      const biensRes = await axios.get(`${API_BASE}/get_biens.php`, { params:{ page:1, per_page:5 }, withCredentials: true });
      const biens = biensRes.data?.biens || [];
      const totalBiens = biensRes.data?.total || (Array.isArray(biens)?biens.length:0);

      // active users
      let usersActive = 0;
      try{ const ua = await axios.get(`${API_BASE}/get_active_users.php`, { withCredentials:true }); usersActive = ua.data?.count ?? (ua.data?.users?.length||0); }catch(e){}

      // pending users
      let usersPending = 0;
      try{ const up = await axios.get(`${API_BASE}/get_pending_users.php`, { withCredentials:true }); usersPending = up.data?.count ?? (up.data?.users?.length||0); }catch(e){}

      // Top active users (by biens conclus this month) - try dedicated endpoint, fallback to active users
      let topUsers = [];
      try{
        const tu = await axios.get(`${API_BASE}/get_top_active_users.php`, { withCredentials:true, params:{ limit:5 } });
        topUsers = tu.data?.users || tu.data || [];
      }catch(err){
        try{
          const ua2 = await axios.get(`${API_BASE}/get_active_users.php`, { withCredentials:true });
          topUsers = ua2.data?.users || ua2.data || [];
        }catch(e){}
      }

      // Normalize and filter: ensure biens_conclus numeric, at least 1, sort desc, limit 5
      topUsers = (Array.isArray(topUsers) ? topUsers : []).map(u=>({
        id: u.id_utilisateur ?? u.id ?? u.user_id,
        type_compte: u.type_compte || u.role || u.type || '-',
        nom_prenom: u.nom_prenom || ((u.nom||'') + ' ' + (u.prenom||'')).trim() || u.nom_agence || '-',
        biens_conclus: Number(u.biens_conclus ?? u.concluded_count ?? u.concluded ?? u.count ?? 0)
      })).filter(u=>u.biens_conclus && u.biens_conclus>=1).sort((a,b)=>b.biens_conclus - a.biens_conclus).slice(0,5);

      // monthly trend intentionally removed

      // fetch total biens conclus
      let totalConcluded = 0;
      try{
        const concl = await axios.get(`${API_BASE}/get_biens_conclus_total.php`, { withCredentials:true });
        totalConcluded = concl.data?.total_biens_conclus ?? 0;
      }catch(e){ /* ignore and keep 0 */ }

      setStats({ biens: totalBiens, recent: biens, topUsers, usersActive, usersPending, biensConclu: totalConcluded });
    }catch(err){ console.error('Erreur fetch dashboard', err); }
    finally{ setLoading(false); }
  }

  function openMessageModal(user){
    setMessageTarget(user);
    setMessageText('');
    setMessageModalOpen(true);
    setTimeout(()=> messageRef.current && messageRef.current.focus(), 80);
  }

  function closeMessageModal(){ setMessageModalOpen(false); setMessageTarget(null); setMessageText(''); }

  async function sendMessage(){
    if(!messageTarget) return alert('Aucun destinataire');
    if(!messageText.trim()) return alert('Message vide');
    setSendingMessage(true);
    try{
      await axios.post(`${API_BASE}/send_message.php`, { to_user: messageTarget.id, message: messageText }, { withCredentials:true });
      alert('Message envoyé');
      closeMessageModal();
    }catch(e){ console.error(e); alert('Erreur envoi message'); }
    finally{ setSendingMessage(false); }
  }

  // recalcTopNow removed — admin requested top list only

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}><FaHome /></div>
          <div>
            <h1 className={styles.title}>Tableau de bord</h1>
            <p className={styles.subtitle}>Vue d'ensemble des activités et éléments récents</p>
          </div>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInner}>
            <div className={styles.statIcon}><FaClipboardList /></div>
            <div className={styles.statText}>
              <div className={styles.statLabel}>Annonces</div>
              <div className={styles.statValue}>{loading? '—' : stats.biens}</div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInner}>
            <div className={styles.statIcon}><FaUsers /></div>
            <div className={styles.statText}>
              <div className={styles.statLabel}>Utilisateurs actifs</div>
              <div className={styles.statValue}>{loading? '—' : stats.usersActive}</div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInner}>
            <div className={styles.statIcon}><FaHourglassHalf /></div>
            <div className={styles.statText}>
              <div className={styles.statLabel}>Utilisateurs en attente</div>
              <div className={styles.statValue}>{loading? '—' : stats.usersPending}</div>
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInner}>
            <div className={styles.statIcon}><FaCheckCircle /></div>
            <div className={styles.statText}>
              <div className={styles.statLabel}>Biens conclus</div>
              <div className={styles.statValue}>{loading? '—' : stats.biensConclu}</div>
            </div>
          </div>
        </div>
      </section>

      {/* action buttons removed as requested */}

      {/* Tendance mensuelle retirée — aucune visualisation */}

      <section className={styles.mainGridSingle}>
        <div className={styles.leftCol}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Top des utilisateurs actifs (mois en cours)</h3>
            {loading ? <p>Chargement...</p> : (
              stats.topUsers.length ? (
                <table className={styles.userTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Type</th>
                      <th>Nom / Prénom</th>
                      <th>Biens conclus</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.map((u,i)=> (
                      <tr key={u.id || i} className={styles.userRow}>
                        <td>{u.id}</td>
                        <td>{u.type_compte}</td>
                        <td>{u.nom_prenom}</td>
                        <td>{u.biens_conclus}</td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.actionSmall} onClick={()=>openMessageModal(u)}>Message</button>
                            <button className={styles.actionSmall} onClick={()=>window.location.href=`/admin/utilisateur/${u.id}`}>Voir profil</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <p>Aucun utilisateur actif ce mois-ci (besoin d'au moins 1 bien conclu).</p>
            )}
            {/* recalcul option removed */}
          </div>
        </div>
      </section>

      {messageModalOpen && (
        <div className={styles.modalOverlay} onClick={closeMessageModal}>
          <div className={styles.modalBox} onClick={e=>e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Message à {messageTarget?.nom_prenom || messageTarget?.id}</div>
              <button className={styles.btnSecondary} onClick={closeMessageModal}>Fermer</button>
            </div>
            <div className={styles.modalBody}>
              <textarea ref={messageRef} value={messageText} onChange={e=>setMessageText(e.target.value)} placeholder="Écrire un message..." />
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={closeMessageModal}>Annuler</button>
              <button className={styles.btnPrimary} onClick={sendMessage} disabled={sendingMessage}>{sendingMessage? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccueilAdmin;
