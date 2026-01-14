import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './InscriptionsIncompletes.module.css';
import { FaEye, FaTrash, FaEnvelope, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';

export default function InscriptionsIncompletes(){
  const [users,setUsers] = useState([]);
  const [page,setPage] = useState(1);
  const [perPage] = useState(8);
  const [total,setTotal] = useState(0);
  const [loading,setLoading] = useState(false);
  const [selected,setSelected] = useState(null);

  useEffect(()=>{ fetchPage(page); },[page]);

  async function fetchPage(p){
    setLoading(true);
    try{
      const res = await axios.get(`${API_BASE}/get_incomplete_users.php`, { params: { page: p, per_page: perPage }, withCredentials: true });
      const j = res.data;
      if(j.success){ setUsers(j.users); setTotal(j.total); }
    }catch(err){ console.error(err); }
    finally{ setLoading(false); }
  }

  function openDetails(u){ setSelected(u); }
  function closeDetails(){ setSelected(null); }

  async function handleDelete(id){
    if(!confirm('Supprimer cet utilisateur ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/delete_user.php`, { id }, { withCredentials: true });
      const j = res.data;
      if(j.success){ fetchPage(page); }
      else alert('Erreur suppression');
    }catch(e){ console.error(e); alert('Erreur suppression'); }
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className={styles.container}>
      <header className={styles.header}><h2>Inscriptions incomplètes</h2></header>

      <div className={styles.listHeader}>
        <div className={styles.colId}>ID</div>
        <div className={styles.colUser}>Nom / Agence</div>
        <div className={styles.colType}>Type</div>
        <div className={styles.colDate}>Date d'inscription</div>
        <div className={styles.colView}>Voir</div>
        <div className={styles.colAction}>Action</div>
      </div>

      <div className={styles.rows}>
        {loading && <div className={styles.loading}>Chargement...</div>}
        {!loading && users.length===0 && <div className={styles.empty}>Aucun utilisateur trouvé.</div>}
        {users.map(u=> (
          <div key={u.id_utilisateur} className={styles.row}>
            <div className={styles.colId}>{u.id_utilisateur}</div>
            <div className={styles.colUser}>{u.type_compte === 'agence' ? (u.nom_agence || '-') : (u.nom_prenom || '-')}</div>
            <div className={styles.colType}>{u.type_compte}</div>
            <div className={styles.colDate}>{(new Date(u.created_at)).toLocaleString()}</div>
            <div className={styles.colView}><button className={styles.iconBtn} onClick={()=>openDetails(u)} title="Voir détails"><FaEye/></button></div>
            <div className={styles.colAction}>
              <button className={styles.actionBtn} onClick={()=>handleDelete(u.id_utilisateur)} title="Supprimer"><FaTrash/></button>
              <a className={styles.actionBtn} href={`mailto:${u.email || ''}`} title="Message"><FaEnvelope/></a>
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

      {selected && (
        <div className={styles.modalOverlay} onClick={closeDetails}>
          <div className={styles.modal} onClick={(e)=>e.stopPropagation()}>
            <h3>Détails utilisateur</h3>
            <dl>
              <dt>ID</dt><dd>{selected.id_utilisateur}</dd>
              <dt>Type</dt><dd>{selected.type_compte}</dd>
              <dt>Nom / Agence</dt><dd>{selected.type_compte === 'agence'? (selected.nom_agence||'-') : (selected.nom_prenom||'-')}</dd>
              <dt>Date inscription</dt><dd>{(new Date(selected.created_at)).toLocaleString()}</dd>
              <dt>Email</dt><dd>{selected.email || '-'}</dd>
            </dl>
            <div className={styles.modalActions}><button onClick={closeDetails}>Fermer</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
