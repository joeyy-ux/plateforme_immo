import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './GestionBiens.module.css';
import { FaEye, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const DETAILS_API = 'http://localhost/plateforme_immo/public/api_dashboard_users/details_bien.php';
const APP_BASE = 'http://localhost/plateforme_immo/';

export default function GestionBiens(){
  const [biens, setBiens] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(()=>{ fetchPage(page); },[page]);

  async function fetchPage(p){
    setLoading(true);
    try{
      const res = await axios.get(`${API_BASE}/get_biens.php`, { params:{ page:p, per_page:perPage }, withCredentials: true });
      const j = res.data;
      if(j.success){ setBiens(j.biens); setTotal(j.total); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  async function openDetails(b){
    // navigate to full-page detail
    navigate(`/admin/gestion-biens/${b.id_bien}`);
  }

  function openLightbox(images, index=0){
    const imgs = (images||[]).map(p=> p && p.startsWith('http') ? p : (APP_BASE + String(p||'').replace(/^\/?/,'')));
    setLbImages(imgs);
    setLbIndex(index);
    setLbOpen(true);
  }

  async function handleValidate(id){
    if(!confirm('Valider cette annonce ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/validate_bien.php`, { id }, { withCredentials: true });
      if(res.data.success) fetchPage(page);
      else alert('Erreur lors de la validation');
    }catch(e){ console.error(e); alert('Erreur lors de la validation'); }
  }

  async function handleReject(id){
    if(!confirm('Rejeter cette annonce ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/reject_bien.php`, { id }, { withCredentials: true });
      if(res.data.success) fetchPage(page);
      else alert('Erreur lors du rejet');
    }catch(e){ console.error(e); alert('Erreur lors du rejet'); }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}><h2>Gestion des biens</h2></header>

      <div className={styles.listHeader}>
        <div className={styles.colId}>ID</div>
        <div className={styles.colUser}>Utilisateur</div>
        <div className={styles.colTitle}>Titre</div>
        <div className={styles.colType}>Type</div>
        <div className={styles.colPrice}>Prix</div>
        <div className={styles.colLocal}>Adresse</div>
        <div className={styles.colStatut}>Statut</div>
        <div className={styles.colAction}>Actions</div>
      </div>

      <div className={styles.rows}>
        {loading && <div className={styles.loading}>Chargement...</div>}
        {!loading && biens.length===0 && <div className={styles.empty}>Aucun bien.</div>}
        {biens.map(b=> (
          <div key={b.id_bien} className={styles.row}>
            <div className={styles.colId}>{b.id_bien}</div>
            <div className={styles.colUser}>{b.nom_prenom || `${(b.nom||'').trim()} ${(b.prenom||'').trim()}`.trim() || b.id_utilisateur}</div>
            <div className={styles.colTitle}>{b.titre}</div>
            <div className={styles.colType}>{b.type_bien}</div>
            <div className={styles.colPrice}>{b.prix_bien}</div>
            <div className={styles.colLocal}>{b.ville || '-'}</div>
            <div className={styles.colStatut}>
              {(() => {
                const s = (b.statut_bien||'').toString().toLowerCase();
                const cls = s.includes('attente') || s.includes('pending') ? styles.statusPending : (s.includes('pub') || s.includes('publie') || s.includes('published') ? styles.statusPublished : styles.statusNeutral);
                return <span className={`${styles.statusBadge} ${cls}`}>{b.statut_bien || '-'}</span>;
              })()}
            </div>
            <div className={styles.colAction}>
              <button className={styles.iconBtn} onClick={()=>openDetails(b)} title="Voir détails"><FaEye/></button>
              <button className={styles.actionValidate} onClick={()=>handleValidate(b.id_bien)} title="Valider"><FaCheck/></button>
              <button className={styles.actionReject} onClick={()=>handleReject(b.id_bien)} title="Rejeter"><FaTimes/></button>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><FaChevronLeft/></button>
          <span>Page {page} / {Math.max(1, Math.ceil(total / perPage))}</span>
          <button disabled={page>=Math.max(1, Math.ceil(total / perPage))} onClick={()=>setPage(p=>Math.min(Math.max(1, Math.ceil(total / perPage)),p+1))}><FaChevronRight/></button>
        </div>
      </footer>

      {/* details are now on a dedicated page */}

      {lbOpen && (
        <div className={styles.lightboxOverlay} onClick={()=>setLbOpen(false)}>
          <div className={styles.lightboxContent} onClick={e=>e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={()=>setLbOpen(false)}>Fermer</button>
            <img src={lbImages[lbIndex]} alt="preview" className={styles.lightboxImg} />
            <div className={styles.lightboxNav}>
              <button onClick={()=>setLbIndex(i=>Math.max(0,i-1))} disabled={lbIndex<=0}>‹</button>
              <button onClick={()=>setLbIndex(i=>Math.min(i+1, lbImages.length-1))} disabled={lbIndex>=lbImages.length-1}>›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
