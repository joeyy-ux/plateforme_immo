import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './UtilisateursActifs.module.css';
import { FaEye, FaBan, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const APP_BASE = 'http://localhost/plateforme_immo/';

export default function UtilisateursActifs() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage] = useState(8);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const navigate = useNavigate();

  const load = async (p = 1) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/get_active_users.php?page=${p}&per_page=${perPage}`, { withCredentials: true });
      if (res.data?.success) {
        setUsers(res.data.users || []);
        setTotal(res.data.total || 0);
        setPage(res.data.page || p);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (err) {
      console.error('load active users', err?.response?.data || err.message || err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, []);

  // lock body scroll while modal is open
  useEffect(() => {
    if (selected) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  const viewDetails = async (id) => {
    // navigate to full user detail page
    navigate(`/admin/utilisateur/${id}`);
  };

  const suspendUser = async (id) => {
    if (!window.confirm('Suspendre cet utilisateur ?')) return;
    try {
      const res = await axios.post(`${API_BASE}/suspend_user.php`, { id }, { withCredentials: true });
      if (res.data?.success) {
        load(page);
      } else {
        alert(res.data?.message || 'Erreur');
      }
    } catch (err) {
      console.error('suspend', err?.response?.data || err.message || err);
      alert('Erreur serveur');
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Supprimer cet utilisateur ?')) return;
    try {
      const res = await axios.post(`${API_BASE}/delete_user.php`, { id }, { withCredentials: true });
      if (res.data?.success) {
        load(page);
      } else {
        alert(res.data?.message || 'Erreur');
      }
    } catch (err) {
      console.error('delete user', err?.response?.data || err.message || err);
      alert('Erreur serveur');
    }
  };

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

  return (
    <div>

      {loading ? (
        <div className={styles.loading}>Chargement...</div>
      ) : (
        <>
          <div className={styles.container}>
            <div className={styles.header}>
              <h2>Utilisateurs actifs</h2>
            </div>

            <div className={styles.listHeader}>
              <div className={styles.colId}>ID</div>
              <div className={styles.colUser}>Nom / Agence</div>
              <div className={styles.colType}>Type</div>
              <div className={styles.colDate}>Date inscription</div>
              <div className={styles.colBiens}>Biens</div>
              <div className={styles.colStatut}>Statut</div>
              <div className={styles.colAction}>Actions</div>
            </div>

            <div className={styles.rows}>
              {users.map(u => (
                <div key={u.id_utilisateur} className={styles.row}>
                  <div className={styles.colId}>{u.id_utilisateur}</div>
                  <div className={styles.colUser}>{u.nom_prenom || u.nom_agence}</div>
                  <div className={styles.colType}>{u.type_compte}</div>
                  <div className={styles.colDate}>{u.created_at}</div>
                  <div className={styles.colBiens}>{u.nb_biens}</div>
                  <div className={styles.colStatut}>{u.statut}</div>
                        <div className={styles.colAction}>
                          <button className={styles.iconBtn} onClick={() => viewDetails(u.id_utilisateur)} title={`Voir — ${u.email || '-'}`}><FaEye/></button>
                          <button className={styles.actionSuspend} onClick={() => suspendUser(u.id_utilisateur)} title={`Suspendre — ${u.nb_biens} biens`}><FaBan/></button>
                          <button className={styles.actionDelete} onClick={() => deleteUser(u.id_utilisateur)} title={`Supprimer — ${u.email || '-'}`}><FaTrash/></button>
                        </div>
                </div>
              ))}
            </div>

            <div className={styles.footer}>
              <div className={styles.pagination}>
                <button disabled={page <= 1} onClick={() => load(page - 1)}>Préc.</button>
                <span>Page {page} / {Math.ceil(total / perPage)}</span>
                <button disabled={page >= Math.ceil(total / perPage)} onClick={() => load(page + 1)}>Suiv.</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* modal for details (matches UtilisateursEnAttente) */}
      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Détails utilisateur</h3>
            {modalLoading ? (
              <div>Chargement...</div>
            ) : (
              <>
                <h4>Utilisateur</h4>
                <dl>
                  <dt>ID</dt><dd>{selected.utilisateur.id_utilisateur}</dd>
                  <dt>Type</dt><dd>{selected.utilisateur.type_compte}</dd>
                  <dt>Nom / Agence</dt><dd>{selected.utilisateur.type_compte === 'agence' ? (selected.utilisateur.nom_agence||'-') : (selected.utilisateur.nom_prenom||'-')}</dd>
                  <dt>Date inscription</dt><dd>{(new Date(selected.utilisateur.created_at)).toLocaleString()}</dd>
                  <dt>Email</dt><dd>{selected.utilisateur.email || '-'}</dd>
                  <dt>Statut</dt><dd>{selected.utilisateur.statut}</dd>
                </dl>

                {selected.profile && (
                  <>
                    <h4>Profil ({selected.utilisateur.type_compte})</h4>
                    <div className={styles.profileGrid}>
                      {Object.entries(selected.profile).map(([k,v])=> {
                        const val = v || '';
                        const lower = String(k).toLowerCase();
                        const looksLikeFile = /photo|logo|piece|selfie|file|fichier/.test(lower) || /uploads\//.test(val);

                          if(looksLikeFile){
                          let paths = [];
                          try{
                            const maybe = JSON.parse(val);
                            if(Array.isArray(maybe)) paths = maybe;
                          }catch(e){
                            if(val.indexOf('|')!==-1) paths = val.split('|').map(s=>s.trim()).filter(Boolean);
                            else if(val.indexOf(',')!==-1) paths = val.split(',').map(s=>s.trim()).filter(Boolean);
                            else if(val) paths = [val.trim()];
                          }

                          return (
                            <div key={k} className={styles.profileFieldImage}>
                              <div className={styles.profileLabel}>{prettyLabel(k)}</div>
                              <div className={styles.imageRow}>
                                {paths.length===0 && <div className={styles.noValue}>-</div>}
                                {paths.map((p,idx)=>{
                                  const src = p.startsWith('http') ? p : (APP_BASE + p.replace(/^\/?/, ''));
                                  return (
                                    <img key={idx}
                                      src={src}
                                      alt={k}
                                      className={styles.profileImage}
                                      onClick={()=>{ setLightboxImages(paths.map(pp=> pp.startsWith('http')?pp:(APP_BASE + pp.replace(/^\/?/,'') ))); setLightboxIndex(idx); setLightboxOpen(true); }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }

                        return (
                            <div key={k} className={styles.profileField}><div className={styles.profileLabel}>{prettyLabel(k)}</div><div className={styles.profileValue}>{val || '-'}</div></div>
                        );
                      })}
                    </div>
                  </>
                )}

                <div className={styles.modalActions}>
                  <div className={styles.modalLeftActions}>
                    <button className={styles.actionDelete} onClick={()=>deleteUser(selected.utilisateur.id_utilisateur)} disabled={modalLoading}>Supprimer</button>
                    <button className={styles.actionSuspend} onClick={()=>suspendUser(selected.utilisateur.id_utilisateur)} disabled={modalLoading}>Suspendre</button>
                  </div>
                  <div className={styles.modalRightActions}>
                    <button onClick={() => setSelected(null)}>Fermer</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {lightboxOpen && (
        <div className={styles.lightboxOverlay} onClick={()=>setLightboxOpen(false)}>
          <div className={styles.lightboxContent} onClick={e=>e.stopPropagation()}>
            <button className={styles.lightboxBtn} onClick={()=>setLightboxOpen(false)}>Fermer</button>
            <div>
              <img src={lightboxImages[lightboxIndex]} alt="preview" className={styles.lightboxImg}/>
              <div className={styles.lightboxNav}>
                <button onClick={()=>setLightboxIndex(i=>Math.max(0,i-1))} disabled={lightboxIndex<=0}>‹</button>
                <button onClick={()=>setLightboxIndex(i=>Math.min(i+1, lightboxImages.length-1))} disabled={lightboxIndex>=lightboxImages.length-1}>›</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
