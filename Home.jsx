import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from './assets/logo/logo_immo.jpeg';
import {
  FaHome,
  FaInfoCircle,
  FaBuilding,
  FaBlog,
  FaEnvelope,
  FaUserPlus,
  FaSignInAlt,
  FaSearch,
  FaChevronDown,
  FaTimes,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaTag,
  FaMoneyBillWave
} from 'react-icons/fa';
import styles from './Home.module.css';

const Home = () => {
  const [searchData, setSearchData] = useState({
    typeOffre: '',
    query: '',
    typeBien: '',
    prix: ''
  });

  const [activeModal, setActiveModal] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);ccccccccc

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await axios.get('http://localhost/projet_plateforme/public/api_generale/get_properties.php');
        if (response.data.success) {
          setProperties(response.data.properties);
        } else {
          setPropertiesError(response.data.message || 'Erreur lors du chargement des propriétés');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des propriétés:', error);
        setPropertiesError('Erreur de connexion au serveur');
      } finally {
        setLoadingProperties(false);
      }
    };

    fetchProperties();
  }, []);

  const handleChange = (e) => {
    setSearchData({
      ...searchData,
      [e.target.name]: e.target.value
    });
  };

  const toggleModal = (modalType) => {
    setActiveModal(activeModal === modalType ? null : modalType);
  };

  const selectOption = (field, value) => {
    setSearchData({...searchData, [field]: value});
    setActiveModal(null);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Recherche:', searchData);
  };

  return (
    <div className={styles.home}>
      {/* Barre de navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.navLogo}>
            <img src={logo} alt="Logo de l'application immobilière" />
          </Link>
          <ul className={styles.navMenu}>
            <li><Link to="/" className={styles.navHome}><FaHome /> Accueil</Link></li>
            <li><Link to="/about" className={styles.navAbout}><FaInfoCircle /> À propos</Link></li>
            <li><Link to="/louer" className={styles.navLouer}><FaBuilding /> Bien à louer</Link></li>
            <li><Link to="/vendre" className={styles.navVendre}><FaHome /> Bien à vendre</Link></li>
            <li><Link to="/blog" className={styles.navBlog}><FaBlog /> Blog/Conseils</Link></li>
            <li><Link to="/contact" className={styles.navContact}><FaEnvelope /> Contact</Link></li>
            <li><Link to="/rejoindre" className={styles.navHighlight}><FaUserPlus /> Rejoindre la plateforme</Link></li>
            <li><Link to="/connexion" className={styles.navHighlight}><FaSignInAlt /> Connexion</Link></li>
          </ul>
        </div>
      </nav>

      {/* Section hero */}
      <section className={styles.hero} onClick={() => setActiveModal(null)}>
        <div className={styles.heroOverlay}>
          <h1 className={styles.heroTitle}>Trouvez votre propriété idéale en Côte d'Ivoire</h1>
          <p className={styles.heroSubtitle}>Des milliers d'offres vérifiées à votre portée</p>
          
          <form onSubmit={handleSearch} className={styles.searchForm} onClick={(e) => e.stopPropagation()}>
            <div className={styles.searchBar}>
              <input 
                type="text" 
                name="query" 
                value={searchData.query} 
                onChange={handleChange} 
                placeholder="Rechercher une propriété..." 
                className={styles.searchInput}
              />
              
              <div className={styles.dropdown} onClick={() => toggleModal('typeBien')}>
                <span>
                  {searchData.typeBien || 'Type de bien'}
                </span>
                <FaChevronDown className={styles.dropdownIcon} />
                {activeModal === 'typeBien' && (
                  <div className={styles.dropdownMenu}>
                    <div onClick={() => selectOption('typeBien', 'Maison')} className={styles.dropdownItem}>Maison</div>
                    <div onClick={() => selectOption('typeBien', 'Appartement')} className={styles.dropdownItem}>Appartement</div>
                    <div onClick={() => selectOption('typeBien', 'Terrain')} className={styles.dropdownItem}>Terrain</div>
                    <div onClick={() => selectOption('typeBien', 'Bureau')} className={styles.dropdownItem}>Bureau</div>
                    <div onClick={() => selectOption('typeBien', 'Commerce')} className={styles.dropdownItem}>Commerce</div>
                  </div>
                )}
              </div>
              
              <div className={styles.dropdown} onClick={() => toggleModal('typeOffre')}>
                <span>
                  {searchData.typeOffre === 'vendre' ? 'À vendre' : searchData.typeOffre === 'louer' ? 'À louer' : 'Type d\'offre'}
                </span>
                <FaChevronDown className={styles.dropdownIcon} />
                {activeModal === 'typeOffre' && (
                  <div className={styles.dropdownMenu}>
                    <div onClick={() => selectOption('typeOffre', 'vendre')} className={styles.dropdownItem}>À vendre</div>
                    <div onClick={() => selectOption('typeOffre', 'louer')} className={styles.dropdownItem}>À louer</div>
                  </div>
                )}
              </div>
              
              <div className={styles.dropdown} onClick={() => toggleModal('prix')}>
                <span>
                  {searchData.prix || 'Prix'}
                </span>
                <FaChevronDown className={styles.dropdownIcon} />
                {activeModal === 'prix' && (
                  <div className={styles.dropdownMenu}>
                    <div onClick={() => selectOption('prix', '0-50M')} className={styles.dropdownItem}>0 - 50 Millions</div>
                    <div onClick={() => selectOption('prix', '50M-100M')} className={styles.dropdownItem}>50M - 100M</div>
                    <div onClick={() => selectOption('prix', '100M-200M')} className={styles.dropdownItem}>100M - 200M</div>
                    <div onClick={() => selectOption('prix', '200M-500M')} className={styles.dropdownItem}>200M - 500M</div>
                    <div onClick={() => selectOption('prix', '500M+')} className={styles.dropdownItem}>500M et plus</div>
                  </div>
                )}
              </div>
              
              <button type="submit" className={styles.searchBtn}>
                <FaSearch />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Section propriétés */}
      <section className={styles.propertiesSection}>
        <div className={styles.container}>
          <h2 className={styles.propertiesTitle}>Propriétés Disponibles</h2>
          {loadingProperties ? (
            <div className={styles.propertiesGrid}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.propertyCard}>
                  <div className={styles.propertyImageContainer}>
                    <div className={styles.skeleton} style={{ height: '100%' }} />
                  </div>
                  <div className={styles.propertyInfo}>
                    <div className={styles.skeleton} style={{ height: '18px', width: '60%', marginBottom: '8px' }} />
                    <div className={styles.skeleton} style={{ height: '14px', width: '40%', marginBottom: '6px' }} />
                    <div className={styles.skeleton} style={{ height: '14px', width: '70%', marginBottom: '6px' }} />
                    <div className={styles.skeleton} style={{ height: '20px', width: '35%', marginBottom: '6px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : propertiesError ? (
            <div className={styles.errorContainer}>
              <FaTimes className={styles.errorIcon} />
              <p>{propertiesError}</p>
            </div>
          ) : properties.length === 0 ? (
            <div className={styles.noProperties}>
              <FaBuilding className={styles.noPropertiesIcon} />
              <p>Aucun bien disponible pour le moment</p>
            </div>
          ) : (
            <>
              <div className={styles.propertiesGrid}>
                {properties.map((property) => {
                  const rawPrix = property.prix;
                  const prixNumber = rawPrix != null && rawPrix !== '' ? Number(String(rawPrix).replace(/\s+/g, '').replace(/,/g, '')) : NaN;
                  const hasPrice = Number.isFinite(prixNumber) && prixNumber > 0;
                  const priceDisplay = hasPrice
                    ? `${prixNumber.toLocaleString()} FCFA${property.typeOffre === 'louer' ? '/mois' : ''}`
                    : (rawPrix ? String(rawPrix) : 'Prix non renseigné');

                  const offreLabel = property.typeOffre === 'vendre' ? 'À vendre' : property.typeOffre === 'louer' ? 'À louer' : (property.typeOffre || '');

                  return (
                    <div key={property.id} className={styles.propertyCard}>
                      <div className={styles.propertyImageContainer}>
                        <span className={styles.verifiedBadge}>
                          <FaCheckCircle className={styles.verifiedIcon} />
                          Vérifié
                        </span>
                        <img
                          src={property.photo}
                          alt={`${property.typeBien} à ${property.ville}`}
                          className={styles.propertyImage}
                          onError={(e) => { e.target.src = logo; }}
                        />
                      </div>
                      <div className={styles.propertyInfo}>
                        <h3 className={styles.propertyTitle}>{property.titre || property.typeBien}</h3>

                        <div className={styles.propertyRow}>
                          <FaBuilding className={styles.rowIcon} /> 
                          <strong>Type de bien:</strong> 
                          <span className={styles.rowValue}>{property.typeBien}</span>
                        </div>
                        <div className={styles.propertyRow}>
                          <FaTag className={styles.rowIcon} /> 
                          <strong>Type d'offre:</strong> 
                          <span className={styles.rowValue}>{offreLabel}</span>
                        </div>
                        <div className={styles.propertyRow}>
                          <FaMapMarkerAlt className={styles.rowIcon} /> 
                          <strong>Adresse:</strong> 
                          <span className={styles.rowValue}>{property.ville}{property.commune && `, ${property.commune}`}</span>
                        </div>

                        <div className={styles.propertyRow}>
                          <FaMoneyBillWave className={styles.rowIcon} /> 
                          <strong>Prix:</strong> 
                          <span className={`${styles.rowValue} ${styles.priceHighlight}`}>
                            {priceDisplay}
                          </span>
                        </div>

                        {/* Trait horizontal ajouté ici */}
                        <hr className={styles.propertyDivider} />

                        <div className={styles.ownerRow}>
                          <img 
                            src={property.owner?.photo || logo} 
                            alt={property.owner?.name || 'Annonceur'} 
                            className={styles.ownerPhoto} 
                            onError={(e) => { e.target.src = logo; }} 
                          />
                          <div className={styles.ownerMeta}>
                            <div className={styles.ownerName}>{property.owner?.name || 'Annonceur'}</div>
                            <div className={styles.ownerType}>{property.owner?.type_compte || ''}</div>
                          </div>
                        </div>

                        <div className={styles.propertyActions}>
                          <div className={styles.feeInfo}>
                            <strong>Frais de visite:</strong>&nbsp;
                            {property.frais_visite ? property.frais_visite : 'Non renseigné'}
                            {property.frais_visite && String(property.frais_visite).toLowerCase() === 'oui' && property.prix_visite ? (
                              <span className={styles.prixVisite}> &nbsp;({property.prix_visite})</span>
                            ) : null}
                          </div>

                          <Link to={`/bien/${property.id}`} className={styles.detailsBtn}>Détails</Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Bouton "Voir toutes les propriétés" */}
              <div className={styles.seeAllContainer}>
                <Link to="/toutes-les-proprietes" className={styles.seeAllBtn}>
                  Voir toutes les propriétés
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section caractéristiques - Style simple */}
<section className={styles.featuresSection}>
  <div className={styles.container}>
    <h2 className={styles.sectionTitle}>Trouver la propriété parfaite pour son entreprise</h2>
    
    <div className={styles.featuresGrid}>
      {/* Bloc 1 */}
      <div className={styles.featureBlock}>
        <div className={styles.featureIcon}>
          <FaCheckCircle />
        </div>
        <h3 className={styles.featureTitle}>Vérification des annonces</h3>
        <p className={styles.featureSubtitle}>(Anti-arnaques, Annonces fiables)</p>
        <p className={styles.featureText}>
          Toutes nos annonces passent par un processus de vérification rigoureux pour éliminer les fraudes 
          et garantir l'authenticité de chaque propriété listée sur notre plateforme.
        </p>
      </div>

      {/* Bloc 2 */}
      <div className={styles.featureBlock}>
        <div className={styles.featureIcon}>
          <FaEnvelope />
        </div>
        <h3 className={styles.featureTitle}>Support client réactif</h3>
        <p className={styles.featureSubtitle}>(Assistance rapide et efficace)</p>
        <p className={styles.featureText}>
          Notre équipe de support est disponible 7j/7 pour répondre à vos questions et vous accompagner 
          dans toutes vos démarches immobilières avec professionnalisme et réactivité.
        </p>
      </div>

      {/* Bloc 3 */}
      <div className={styles.featureBlock}>
        <div className={styles.featureIcon}>
          <FaMapMarkerAlt />
        </div>
        <h3 className={styles.featureTitle}>Mise en relation rapide</h3>
        <p className={styles.featureSubtitle}>(Contact immédiat avec Propriétaire/agence)</p>
        <p className={styles.featureText}>
          Grâce à notre système de messagerie intégré, vous pouvez contacter directement les propriétaires 
          et agences partenaires en quelques clics pour accélérer vos transactions.
        </p>
      </div>
    </div>
  </div>
</section>



{/* Section "Vous êtes" - Version très simple */}
<section className={styles.youAreSection}>
  <div className={styles.youAreGrid}>
    
    {/* Colonne GAUCHE */}
    <div className={styles.youAreColumn}>
      <h3 className={styles.youAreTitle}>Vous êtes un client</h3>
      <div className={styles.youAreContent}>
        <div className={styles.youAreItem}>
          <h4>Recherchez</h4>
          <p>Trouvez votre bien idéal avec nos filtres</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Contactez</h4>
          <p>Discutez directement avec le propriétaire</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Visitez</h4>
          <p>Organisez une visite pour découvrir</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Visitez</h4>
          <p>Organisez une visite pour découvrir</p>
        </div>
      </div>
    </div>

    {/* Colonne DROITE */}
    <div className={styles.youAreColumn}>
      <h3 className={styles.youAreTitle}>Vous voulez nous rejoindre</h3>
      <div className={styles.youAreContent}>
        <div className={styles.youAreItem}>
          <h4>Publiez</h4>
          <p>Mettez en ligne vos annonces gratuitement</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Exposez</h4>
          <p>Présentez à des milliers de clients</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Vendez/Louez</h4>
          <p>Trouvez rapidement acquéreurs/locataires</p>
        </div>
        <div className={styles.youAreItem}>
          <h4>Vendez/Louez</h4>
          <p>Trouvez rapidement acquéreurs/locataires</p>ccccccccccccccccccccccccccccc
        </div>
      </div>
    </div>

  </div>
</section>
    </div>
  );
};
jjjjjjnnnbbbbb
export default Home;
