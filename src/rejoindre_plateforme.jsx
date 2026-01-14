import styles from "./rejoindre_plateforme.module.css";

export default function HomeHero() {
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>Logo + Nom de la plateforme</div>
        <button className={styles.headerBtn}>Inscrivez un bien</button>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay}>
          <h1>Publier vos biens en côte d'ivoire</h1>
          <p>
            Villa, studio, terrain, appartement et bien plus encore.
            Gagner en visibilité et trouver vos clients rapidement
          </p>
          <button className={styles.primaryBtn}>
            Commencez gratuitement
          </button>
        </div>
      </section>

      {/* Pourquoi */}
      <div className={styles.center}>
        <button className={styles.secondaryBtn}>
          Pourquoi nous choisir ?
        </button>
      </div>

      {/* Avantages */}
      <section className={styles.features}>
        <div>
          <h3>✅ Visibilité nationale</h3>
          <p>
            Des milliers d’utilisateurs partout en Côte d’Ivoire recherchent
            chaque jour.
          </p>
        </div>

        <div>
          <h3>✅ Sécurité</h3>
          <p>
            Contrats avant transaction et assistance dédiée 7j/7.
          </p>
        </div>
      </section>

      {/* Abonnement */}
      <div className={styles.center}>
        <button className={styles.secondaryBtn}>
          Aucun abonnement mensuel
        </button>
      </div>

      {/* Pricing */}
      <section className={styles.pricing}>
        <h2>Publier vos bien gratuitement</h2>
        <p className={styles.highlight}>
          Vous payez seulement 3% de commission lorsqu’une transaction est conclue.
        </p>

        <ul>
          <li>✅ Zéro abonnement mensuel</li>
          <li>✅ Publiez sans limite</li>
          <li>✅ 3% uniquement sur les ventes réussies</li>
          <li>✅ Transparence et sécurité garanties</li>
        </ul>

        <button className={styles.primaryBtn}>
          Inscrivez vous gratuitement
        </button>
      </section>

      {/* Étapes */}
      <div className={styles.center}>
        <button className={styles.secondaryBtn}>
          Commencez en 4 étapes simples
        </button>
      </div>

      <section className={styles.steps}>
        <div>
          <h4>1. Créer un compte</h4>
          <p>Propriétaire, agence ou démarcheur.</p>
        </div>
        <div>
          <h4>2. Compléter votre profil</h4>
          <p>Ajoutez vos informations et logo/photo.</p>
        </div>
        <div>
          <h4>3. Publier vos biens</h4>
          <p>Studios, maisons, terrains en quelques clics.</p>
        </div>
        <div>
          <h4>4. Recevez vos clients</h4>
          <p>Signez vos contrats et concluez vos ventes.</p>
        </div>
      </section>
    </div>
  );
}
