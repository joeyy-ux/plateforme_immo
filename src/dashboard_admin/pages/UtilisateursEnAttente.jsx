import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './UtilisateursEnAttente.module.css';
import { FaEye, FaCheck, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const APP_BASE = 'http://localhost/plateforme_immo/';

export default function UtilisateursEnAttente(){
  const [users,setUsers] = useState([]);
  const [page,setPage] = useState(1);
  const [perPage] = useState(8);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(false);
  const [selected,setSelected] = useState(null);
  const [modalLoading,setModalLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const navigate = useNavigate();

  // lock body scroll while modal is open
  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  useEffect(() => {
    function onKey(e){
      if(!lightboxOpen) return;
      if(e.key === 'Escape') setLightboxOpen(false);
      if(e.key === 'ArrowRight') setLightboxIndex(i=>Math.min(i+1, lightboxImages.length-1));
      if(e.key === 'ArrowLeft') setLightboxIndex(i=>Math.max(i-1,0));
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, lightboxImages.length]);

  useEffect(()=>{ fetchPage(page); },[page]);

  async function fetchPage(p){
    setLoading(true);
    try{
      const res = await axios.get(`${API_BASE}/get_pending_users.php`, { params:{ page:p, per_page:perPage }, withCredentials: true });
      const j = res.data;
      if(j.success){ setUsers(j.users); setTotal(j.total); }
    }catch(e){ console.error(e); }
    finally{ setLoading(false); }
  }

  async function openDetails(u){
    navigate(`/admin/utilisateur/${u.id_utilisateur}`);
  }

  async function handleValidate(id){
    if(!confirm('Valider cet utilisateur ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/validate_user.php`, { id }, { withCredentials: true });
      if(res.data.success){ fetchPage(page); }
      else alert('Erreur lors de la validation');
    }catch(e){ console.error(e); alert('Erreur lors de la validation'); }
  }

  async function handleReject(id){
    if(!confirm('Rejeter et supprimer cet utilisateur ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/delete_user.php`, { id }, { withCredentials: true });
      if(res.data.success){ fetchPage(page); }
      else alert('Erreur lors de la suppression');
    }catch(e){ console.error(e); alert('Erreur lors de la suppression'); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  function prettyLabel(key){
    const k = String(key || '').toLowerCase();
    const map = {
      'photo_principale': 'Photo principale',
      'logo': 'Logo',
      'piece_recto': 'Pièce identité (recto)',
      'piece_verso': 'Pièce identité (verso)',
      'selfie': 'Selfie',
      'telephone': 'Téléphone',
      'adresse': 'Adresse',
      'ville': 'Ville',
      'code_postal': 'Code postal',
      'nom_prenom': 'Nom et prénom',
      'nom_agence': 'Nom agence',
      'siret': 'SIRET',
    };
    for(const p in map) if(k.includes(p)) return map[p];
    // fallback: humanize
    return key.replace(/_/g,' ').replace(/(^|\s)\S/g, t=>t.toUpperCase());
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}><h2>Utilisateurs en attente</h2></header>

      <div className={styles.listHeader}>
        <div className={styles.colId}>ID</div>
        <div className={styles.colUser}>Nom / Agence</div>
        <div className={styles.colType}>Type</div>
        <div className={styles.colDate}>Date d'inscription</div>
        <div className={styles.colStatut}>Statut</div>
        <div className={styles.colView}>Voir</div>
        <div className={styles.colAction}>Action</div>
      </div>

      <div className={styles.rows}>
        {loading && <div className={styles.loading}>Chargement...</div>}
        {!loading && users.length===0 && <div className={styles.empty}>Aucun utilisateur en attente.</div>}
        {users.map(u=> (
          <div key={u.id_utilisateur} className={styles.row}>
            <div className={styles.colId}>{u.id_utilisateur}</div>
            <div className={styles.colUser}>{u.type_compte === 'agence' ? (u.nom_agence || '-') : (u.nom_prenom || '-')}</div>
            <div className={styles.colType}>{u.type_compte}</div>
            <div className={styles.colDate}>{(new Date(u.created_at)).toLocaleString()}</div>
            <div className={styles.colStatut}>{u.statut}</div>
            <div className={styles.colView}><button className={styles.iconBtn} onClick={()=>openDetails(u)} title="Voir détails"><FaEye/></button></div>
            <div className={styles.colAction}>
              <button className={styles.actionValidate} onClick={()=>handleValidate(u.id_utilisateur)} title="Valider"><FaCheck/></button>
              <button className={styles.actionReject} onClick={()=>handleReject(u.id_utilisateur)} title="Rejeter"><FaTimes/></button>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.pagination}>
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><FaChevronLeft/></button>
          <span>Page {page} / {totalPages}</span>
          <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}><FaChevronRight/></button>
        </div>
      </footer>

    </div>
  );
}
