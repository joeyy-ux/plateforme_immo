import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * MesAnnonces (HTML classique + labels identiques au template PHP)
 * - Classes globales : mes-biens, grille-cartes, carte-bien, photo-bien, infos-bien, statut, publie, attente, btn-details, actions, dropdown, dropbtn, dropdownContent
 * - Envoie cookies (withCredentials)
 * - Icons via FontAwesome (voir import link dans index.html)
 */

export default function MesAnnonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.post(
      "http://localhost/plateforme_immobiliere/public/api_dashboard_users/mes_annonces.php",
      {},
      { withCredentials: true }
    )
    .then(res => {
      if (res?.data && res.data.success === false) {
        const msg = (res.data.errors && (res.data.errors.global || res.data.errors.sql)) || "Non authentifié ou erreur serveur";
        setError(msg);
        setAnnonces([]);
      } else {
        setAnnonces(Array.isArray(res?.data?.annonces) ? res.data.annonces : []);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("mes_annonces error:", err);
      setError("Erreur lors du chargement des annonces. Vérifie la console / Network (CORS/session).");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="aucune-annonce">Chargement...</div>;
  if (error) return <div className="aucune-annonce">{error}</div>;

  return (
    <section className="mes-biens">
      <h2>Mes annonces</h2>

      {annonces.length === 0 ? (
        <div className="aucune-annonce">Vous n’avez encore publié aucune annonce.</div>
      ) : (
        <div className="grille-cartes">
          {annonces.map((annonce) => {
            // fallbacks / normalisations
            const id = annonce.id ?? annonce.id_bien ?? "";
            const titre = annonce.titre ?? "Titre non disponible";
            const type = annonce.type ?? annonce.type_bien ?? "—";
            const offre = annonce.offre ?? annonce.type_offre ?? "—";
            const ville = annonce.ville ?? "Ville non renseignée";
            const dateRaw = annonce.date ?? annonce.date_publication ?? "";
            const dateTxt = dateRaw ? formatDate(dateRaw) : null;

            const statutRaw = String((annonce.statut ?? annonce.statut_bien ?? "")).trim().toLowerCase();
            const isPublie = ["publie", "publié", "published", "1", "true"].includes(statutRaw);
            const statutClass = isPublie ? "publie" : (statutRaw === "suspendre" ? "suspendu" : "attente");
            const statutLabel = isPublie ? "Publié" : (statutRaw === "suspendre" ? "Suspendu" : "En attente");

            const photoSrc = annonce.photo ?? annonce.chemin_photo ?? null;
            const photoFinal = photoSrc ? photoSrc : "https://via.placeholder.com/280x180?text=Photo";

            return (
              <article className="carte-bien" key={id || Math.random()}>
                {/* PHOTO */}
                <div className="photo-bien">
                  {photoSrc ? (
                    <img src={photoFinal} alt={titre} />
                  ) : (
                    <div className="placeholder-photo" aria-hidden="true">
                      <i className="fa fa-image"></i>
                    </div>
                  )}
                </div>

                {/* INFOS - avec titres/labels comme demandé */}
                <div className="infos-bien">
                  <p><strong>Titre de l'annonce :</strong> {titre}</p>
                  <p><strong>Type de bien :</strong> {type}</p>
                  <p><strong>Type d’offre :</strong> {offre}</p>
                  <p><strong>Ville :</strong> {ville}</p>

                  <p className={`statut ${statutClass}`}>
                    <span>
                      {isPublie ? (
                        <><i className="fa fa-check-circle" aria-hidden="true"></i> {statutLabel}</>
                      ) : statutRaw === "suspendre" ? (
                        <><i className="fa fa-ban" aria-hidden="true"></i> {statutLabel}</>
                      ) : (
                        <><i className="fa fa-clock" aria-hidden="true"></i> {statutLabel}</>
                      )}
                    </span>
                  </p>

                  {dateTxt ? (
                    <p className="date"><strong>Publié le :</strong> {dateTxt}</p>
                  ) : null}

                  {/* ACTIONS : Voir détails (avec icône) + dropdown (Modifier / Supprimer avec icônes) */}
                  <div className="actions" style={{display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.5rem"}}>
                    {/* Voir détails */}
                    <a
                      href={`/details.php?id=${encodeURIComponent(id)}`}
                      className="btn-details"
                      style={{display:"inline-flex",alignItems:"center",gap:"0.4rem",textDecoration:"none",padding:"6px 10px",background:"#0b79d0",color:"#fff",borderRadius:4}}
                    >
                      <i className="fa fa-eye" aria-hidden="true"></i>
                      <span>Voir détails</span>
                    </a>

                    {/* Dropdown actions */}
                    <div className="dropdown" style={{position:"relative"}}>
                      <button
                        className="dropbtn"
                        type="button"
                        aria-haspopup="true"
                        aria-expanded="false"
                        style={{padding:"6px 10px",borderRadius:6,border:"1px solid #ddd",background:"#fff",cursor:"pointer"}}
                      >
                        <i className="fa fa-ellipsis-h" aria-hidden="true"></i>
                      </button>

                      <div
                        className="dropdownContent"
                        role="menu"
                        aria-hidden="true"
                        style={{
                          display: "none",
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 6px)",
                          background: "#fff",
                          border: "1px solid #ddd",
                          borderRadius: 6,
                          minWidth: 160,
                          zIndex: 10,
                          boxShadow: "0 6px 18px rgba(0,0,0,0.08)"
                        }}
                      >
                        <a
                          href={`/modifier.php?id=${encodeURIComponent(id)}`}
                          style={{display:"block",padding:"8px 12px",textDecoration:"none",color:"#333"}}
                          role="menuitem"
                        >
                          <i className="fa fa-pen" aria-hidden="true"></i> Modifier
                        </a>
                        <a
                          href={`/supprimer.php?id=${encodeURIComponent(id)}`}
                          style={{display:"block",padding:"8px 12px",textDecoration:"none",color:"#333"}}
                          role="menuitem"
                        >
                          <i className="fa fa-trash" aria-hidden="true"></i> Supprimer
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

/* helper : formater la date (dd/mm/YYYY) */
function formatDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
