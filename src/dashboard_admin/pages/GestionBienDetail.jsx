import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './GestionBiens.module.css';

const DETAILS_API = 'http://localhost/plateforme_immo/public/api_dashboard_users/details_bien.php';
const API_BASE = 'http://localhost/plateforme_immo/public/api_dashboard_admin';
const APP_BASE = 'http://localhost/plateforme_immo/';

export default function GestionBienDetail(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbImages, setLbImages] = useState([]);
  const [lbIndex, setLbIndex] = useState(0);

  useEffect(()=>{ fetch(); },[id]);

  async function fetch(){
    setLoading(true);
    try{
      const res = await axios.get(DETAILS_API, { params: { id }, withCredentials: true });
      if(res.data && res.data.success) setData(res.data);
      else alert(res.data?.message || 'Bien introuvable');
    }catch(e){ console.error(e); alert('Erreur serveur'); }
    finally{ setLoading(false); }
  }

  function openLightbox(images, index=0){
    const imgs = (images||[]).map(p=> p && p.startsWith('http') ? p : (APP_BASE + String(p||'').replace(/^\/?/,'')));
    setLbImages(imgs);
    setLbIndex(index);
    setLbOpen(true);
  }

  function getYouTubeId(url){
    if(!url) return null;
    const ytRegex = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([A-Za-z0-9_-]{6,11})/;
    const m = url.match(ytRegex);
    return m?m[1]:null;
  }

  async function validate(){
    if(!confirm('Valider cette annonce ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/validate_bien.php`, { id: Number(id) }, { withCredentials: true });
      if(res.data?.success){ alert('Annonce validée'); fetch(); }
      else alert(res.data?.message || 'Erreur');
    }catch(e){ console.error(e); alert('Erreur serveur'); }
  }

  async function reject(){
    if(!confirm('Rejeter cette annonce ?')) return;
    try{
      const res = await axios.post(`${API_BASE}/reject_bien.php`, { id: Number(id) }, { withCredentials: true });
      if(res.data?.success){ alert('Annonce rejetée'); fetch(); }
      else alert(res.data?.message || 'Erreur');
    }catch(e){ console.error(e); alert('Erreur serveur'); }
  }

  if(loading) return <div className={styles.loading}>Chargement...</div>;
  if(!data) return <div className={styles.empty}>Aucune donnée</div>;

  const s = data;
  const b = s.bien || {};

  // build gallery images: main + pieces photos
  const galleryImages = [];
  if(b.photo_principale) galleryImages.push(b.photo_principale.startsWith('http')?b.photo_principale:(APP_BASE + b.photo_principale.replace(/^\/?/,'')));
  if(s.pieces_with_photos && s.pieces_with_photos.length>0){
    s.pieces_with_photos.forEach(p=>{ if(p.photos && p.photos.length) p.photos.forEach(ph=> galleryImages.push(ph.startsWith('http')?ph:(APP_BASE + ph.replace(/^\/?/,'')))); });
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerCard}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>{b.titre}</h1>
            <div className={styles.subtitle}>
              <span className={styles.badge}>{b.type_bien}</span>
              <span className={styles.badge}>{b.type_offre}</span>
              <span className={styles.price}>{b.prix_bien}</span>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.btnReject} onClick={reject}>Rejeter</button>
            <button className={styles.btnValidate} onClick={validate}>Valider</button>
            <button className={styles.btnBack} onClick={()=>navigate('/admin/gestion-biens')}>Retour</button>
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        <div className={styles.leftPanel}>
          <div className={styles.galleryCard}>
            <div className={styles.galleryMain}>
              {galleryImages && galleryImages.length>0 ? (
                <img src={galleryImages[0]} alt="principale" className={styles.mainImage} onClick={()=>openLightbox(galleryImages,0)} />
              ) : (
                <div className={styles.noImage}>Pas de photo</div>
              )}
            </div>
          </div>

          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <h4 className={styles.cardTitle}>Détails principaux</h4>
              <div className={styles.detailsList}>
                {b.surface && <div className={styles.detailItem}><span>Surface:</span> {b.surface}</div>}
                {b.meuble && <div className={styles.detailItem}><span>Meublé:</span> {b.meuble}</div>}
                {b.disponibilite && <div className={styles.detailItem}><span>Disponibilité:</span> {b.disponibilite}</div>}
              </div>
            </div>

            {Array.isArray(s.interieur) && s.interieur.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Caractéristiques intérieures</h4>
                <ul className={styles.featureList}>
                  {s.interieur.filter(Boolean).map((c,i)=> <li key={i}><strong>{c.titre}</strong>: {c.description}</li>)}
                </ul>
              </div>
            )}

            {Array.isArray(s.exterieur) && s.exterieur.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Caractéristiques extérieures</h4>
                <div className={styles.chips}>{s.exterieur.filter(Boolean).map((e,i)=>(<span key={i} className={styles.chipLight}>{e}</span>))}</div>
              </div>
            )}

            {s.documents && s.documents.length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Documents</h4>
                <div className={styles.chips}>
                  {s.documents.map((d,i)=> (
                    <span key={i} className={styles.chipLight}>{d.split('/').pop() || d}</span>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(s.conditions_paiement) && s.conditions_paiement.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Conditions de paiement</h4>
                <div className={styles.chips}>{s.conditions_paiement.filter(Boolean).map((c,i)=>(<span key={i} className={styles.chipLight}>{c}</span>))}</div>
              </div>
            )}

            {Array.isArray(s.bonus) && s.bonus.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Bonus</h4>
                <div className={styles.chips}>{s.bonus.filter(Boolean).map((b,i)=>(<span key={i} className={styles.chipLight}>{b}</span>))}</div>
              </div>
            )}

            {Array.isArray(s.commodites) && s.commodites.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Commodités</h4>
                <div className={styles.chips}>{s.commodites.filter(Boolean).map((c,i)=>(<span key={i} className={styles.chip}>{c}</span>))}</div>
              </div>
            )}

            {Array.isArray(s.accessibilites) && s.accessibilites.filter(Boolean).length>0 && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Accessibilités</h4>
                <div className={styles.chips}>{s.accessibilites.filter(Boolean).map((a,i)=>(<span key={i} className={styles.chipLight}>{a}</span>))}</div>
              </div>
            )}

            {s.localisation && ( (s.localisation.ville||s.localisation.commune||s.localisation.quartier) ) && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Localisation</h4>
                <dl className={styles.metaList}>
                  {s.localisation.ville && (<><dt>Ville</dt><dd>{s.localisation.ville}</dd></>)}
                  {s.localisation.commune && (<><dt>Commune</dt><dd>{s.localisation.commune}</dd></>)}
                  {s.localisation.quartier && (<><dt>Quartier</dt><dd>{s.localisation.quartier}</dd></>)}
                </dl>
              </div>
            )}

            {b.description && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Description</h4>
                <p className={styles.description}>{b.description}</p>
              </div>
            )}

            {s.video && s.video.lien_video && (
              <div className={styles.infoCard}>
                <h4 className={styles.cardTitle}>Vidéo</h4>
                {(() => {
                  const lien = s.video.lien_video;
                  const yt = getYouTubeId(lien);
                  if(yt) return (<div className={styles.videoWrap}><iframe title="video" src={`https://www.youtube.com/embed/${yt}`} frameBorder="0" allowFullScreen style={{width:'560px',height:315}} /></div>);
                  if(typeof lien === 'string' && lien.match(/\.(mp4|webm|ogg)(\?|$)/i)) return (<video controls style={{width:'560px',height:315}}><source src={lien} /></video>);
                  return <a href={lien} target="_blank" rel="noreferrer" className={styles.videoLink}>Voir la vidéo</a>;
                })()}
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightPanel}>
          {s.utilisateur && (
            <div className={styles.sideCard}>
              <h4 className={styles.cardTitle}>Propriétaire</h4>
              <div className={styles.ownerInfo}>
                <div className={styles.ownerAvatar}>
                  {s.utilisateur.logo || s.utilisateur.photo_profil ? (
                    <img src={(s.utilisateur.logo||s.utilisateur.photo_profil).startsWith('http')?(s.utilisateur.logo||s.utilisateur.photo_profil):(APP_BASE + (s.utilisateur.logo||s.utilisateur.photo_profil).replace(/^\/?/,''))} alt="owner" />
                  ) : (
                    <div className={styles.avatarPlaceholder}></div>
                  )}
                </div>
                <div className={styles.ownerDetails}>
                  <div className={styles.ownerName}>{s.utilisateur.nom_prenom || s.utilisateur.nom_agence || '-'}</div>
                  <div className={styles.ownerContact}>{s.utilisateur.email || '-'}</div>
                  {s.utilisateur.telephone && <div className={styles.ownerContact}>{s.utilisateur.telephone}</div>}
                  <div className={styles.ownerType}>Type: {s.utilisateur.type_compte || '-'}</div>
                </div>
              </div>
            </div>
          )}

          {s.pieces_with_photos && s.pieces_with_photos.filter(p=>p && Array.isArray(p.photos) && p.photos.length).length>0 && (
            <div className={styles.sideCard}>
              <h4 className={styles.cardTitle}>Pièces & photos</h4>
              <div className={styles.piecesGrid}>
                {s.pieces_with_photos.filter(p=>p && Array.isArray(p.photos) && p.photos.length).map((p,pi)=> {
                  const first = p.photos[0] && (p.photos[0].startsWith('http')?p.photos[0]:(APP_BASE + p.photos[0].replace(/^\/?/,'')));
                  return (
                    <div key={p.id_piece || pi} className={styles.folderCard} onClick={()=>openLightbox(p.photos.map(ph=> ph.startsWith('http')?ph:(APP_BASE + ph.replace(/^\/?/,''))),0)}>
                      <img src={first} alt={p.nom_piece} className={styles.folderThumb} />
                      <div className={styles.folderMeta}>
                        <div className={styles.pieceTitle}>{p.nom_piece}</div>
                        <div className={styles.count}>{(p.photos||[]).length} photo(s)</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

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
