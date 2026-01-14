import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './UtilisateursActifs.module.css';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const APP_BASE = 'http://localhost/plateforme_immo/';

export default function UtilisateurDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSrc, setModalSrc] = useState(null);

  useEffect(()=>{ fetchData(); },[id]);

  async function fetchData(){
    setLoading(true);
    try{
      const res = await axios.get(`${API_BASE}/get_user_details.php`, { params: { id }, withCredentials: true });
      if(res.data?.success) setData(res.data);
      else { alert(res.data?.message || 'Utilisateur introuvable'); }
    }catch(e){ console.error(e); alert('Erreur serveur'); }
    finally{ setLoading(false); }
  }

  async function suspendUser(){
    if(!confirm('Suspendre cet utilisateur ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/suspend_user.php`, { id: Number(id) }, { withCredentials: true });
      if(res.data?.success){ alert('Suspendu'); fetchData(); }
      else alert(res.data?.message || 'Erreur');
    }catch(e){ console.error(e); alert('Erreur serveur'); }
  }

  async function deleteUser(){
    if(!confirm('Supprimer cet utilisateur ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/delete_user.php`, { id: Number(id) }, { withCredentials: true });
      if(res.data?.success){ alert('Supprimé'); navigate('/admin/utilisateurs-actifs'); }
      else alert(res.data?.message || 'Erreur');
    }catch(e){ console.error(e); alert('Erreur serveur'); }
  }

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
    return key.replace(/_/g,' ').replace(/(^|\s)\S/g, t=>t.toUpperCase());
  }

  if(loading) return <div className={styles.loading}>Chargement...</div>;
  if(!data) return <div className={styles.empty}>Aucune donnée</div>;

  const u = data.utilisateur || {};
  // prepare profile fields: separate image fields and text fields
  const profile = data.profile || {};
  let addressKey = Object.keys(profile).find(k => /adresse|address|adresse_complete/i.test(k));
  const imageFields = [];
  const textFields = {};

  Object.entries(profile).forEach(([k,v])=>{
    const val = v || '';
    const lower = String(k).toLowerCase();
    const looksLikeFile = /photo|logo|piece|selfie|file|fichier/.test(lower) || /uploads\//.test(val);
    if(looksLikeFile){ imageFields.push([k,v]); }
    else { textFields[k] = v; }
  });

  // build profile items that will be merged into Informations
  const rightItems = [];
  let addressVal = null;
  if(addressKey){ addressVal = profile[addressKey]; }
  rightItems.push(['Adresse', addressVal || '-']);
  // description may be in profile under 'description' key
  const descKey = Object.keys(textFields).find(k=>/desc|description/i.test(k));
  rightItems.push(['Description', descKey ? (textFields[descKey] || '-') : '-']);
  // Date venant du profil : renommer pour indiquer "pour compléter profil"
  rightItems.push(['Date pour compléter', u.created_at ? (new Date(u.created_at)).toLocaleString() : '-']);

  return (
    <div className={styles.container}>
      <div className={styles.detailHeader}>
        <div>
          <h2>Détails utilisateur — {u.nom_prenom || u.nom_agence || u.email}</h2>
          <div style={{color:'#666',display:'flex',gap:8,alignItems:'center'}}>
            <div>{u.type_compte}</div>
            <div>
              <span className={`${styles.statusBadge} ${String(u.statut||'').toLowerCase().includes('verif') || String(u.statut||'').toLowerCase().includes('vér') ? styles.verified : String(u.statut||'').toLowerCase().includes('suspend') ? styles.suspended : styles.pending}`}>
                {u.statut || '-'}
              </span>
            </div>
          </div>
        </div>
        <div>
          <button className={styles.actionDelete} onClick={deleteUser} style={{marginRight:8}}>Supprimer</button>
          <button className={styles.actionSuspend} onClick={suspendUser}>Suspendre</button>
          <button className={styles.btnBack} onClick={()=>navigate(-1)}>Retour</button>
        </div>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.leftCol}>
          <h4>Informations</h4>
          <div className={styles.infoCard}>
            <dl>
              <dt>ID</dt><dd>{u.id_utilisateur}</dd>
              <dt>Email</dt><dd>{u.email || '-'}</dd>
              <dt>Type</dt><dd>{u.type_compte || '-'}</dd>
              <dt>Date inscription</dt><dd>{u.created_at ? (new Date(u.created_at)).toLocaleString() : '-'}</dd>
              {rightItems.map(([label,val],i)=> (
                <React.Fragment key={i}><dt>{label}</dt><dd className={styles.profileValue}>{val}</dd></React.Fragment>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {imageFields.length>0 && (
        <div style={{marginTop:18}}>
          <h4>Images</h4>
          <div className={styles.imagesRow}>
            {imageFields.map(([k,v],i)=>{
              // normalize to array
              let paths = [];
              try{ const maybe = JSON.parse(v); if(Array.isArray(maybe)) paths = maybe; }catch(e){
                if(String(v).indexOf('|')!==-1) paths = String(v).split('|').map(s=>s.trim()).filter(Boolean);
                else if(String(v).indexOf(',')!==-1) paths = String(v).split(',').map(s=>s.trim()).filter(Boolean);
                else if(v) paths = [String(v).trim()];
              }
              return (
                <div key={i} className={styles.imageBlock}>
                  <div className={styles.imageBlockTitle}>{prettyLabel(k)}</div>
                  <div className={styles.imageRow}>
                    {paths.map((p,pi)=>{
                      const src = p.startsWith('http')?p:(APP_BASE + p.replace(/^\/?/, ''));
                      return <img key={pi} src={src} className={styles.profileImage} alt={k} onClick={()=>{ setModalSrc(src); setModalOpen(true); }} />;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className={styles.modalOverlay} onClick={()=>{ setModalOpen(false); setModalSrc(null); }}>
          <div className={styles.modal} onClick={e=>e.stopPropagation()}>
            <button className={styles.modalClose} onClick={()=>{ setModalOpen(false); setModalSrc(null); }}>✕</button>
            <div style={{textAlign:'center'}}>
              <img src={modalSrc} alt="preview" className={styles.imagePreview} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
