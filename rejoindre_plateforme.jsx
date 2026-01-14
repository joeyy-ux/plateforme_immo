import React, { useState } from "react";
import styles from "./rejoindre_plateforme.module.css";

export default function LandingPage() {
  const [isChecked, setIsChecked] = useState(false);

  const features = [
    "Zéro abonnement mensuel",
    "Publiez sans limite",
    "3% uniquement sur les ventes réussies",
    "Transparence et sécurité garanties"
  ];

  const steps = [
    {
      number: "1",
      title: "Créer un compte",
      description: "Propriétaire, agence ou démarcheur."
    },
    {
      number: "2",
      title: "Compléter votre profil",
      description: "Ajoutez vos informations et logo/photo."
    },
    {
      number: "3",
      title: "Publier vos biens",
      description: "Studios, maisons, terrains en quelques clics."
    },
    {
      number: "4",
      title: "Recevez vos clients",
      description: "Signez vos contrats et concluez vos ventes."
    }
  ];

  return (
    <div className={styles.landingContainer}>
      {/* HERO SECTION */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Publier vos biens en côte d'Ivoire
          </h1>
          <p className={styles.heroSubtitle}>
            Villa, studio, terrain, appartement et bien plus encore. 
            Gagner en visibilité et trouver vos clients rapidement.
          </p>
          <button className={styles.ctaButton}>
            Commencez gratuitement
          </button>
        </div>
      </section>

      {/* WHY CHOOSE US SECTION */}
      <section className={styles.whySection}>
        <h2 className={styles.sectionTitle}>Pourquoi nous choisir ?</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✔</div>
            <h3 className={styles.featureTitle}>Visibilité nationale</h3>
            <p className={styles.featureText}>
              Des milliers d'utilisateurs partout en Côte d'Ivoire recherchent chaque jour.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>✔</div>
            <h3 className={styles.featureTitle}>Sécurité</h3>
            <p className={styles.featureText}>
              Contrats avant transaction et assistance dédiée 7j/7.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className={styles.pricingSection}>
        <div className={styles.pricingHeader}>
          <h2 className={styles.sectionTitle}>Aucun abonnement mensuel</h2>
          <p className={styles.pricingTagline}>Publier vos bien gratuitement</p>
        </div>
        
        <div className={styles.pricingContent}>
          <div className={styles.priceHighlight}>
            <span className={styles.priceText}>
              Vous payez seulement <strong>3% de commission</strong> lorsqu'une transaction est conclue.
            </span>
          </div>
          
          <div className={styles.featuresList}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureItem}>
                <label className={styles.checkboxContainer}>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={() => setIsChecked(!isChecked)}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkmark}></span>
                </label>
                <span className={styles.featureTextItem}>{feature}</span>
              </div>
            ))}
          </div>
          
          <button className={styles.ctaButtonSecondary}>
            Inscrivez vous gratuitement
          </button>
        </div>
      </section>

      {/* STEPS SECTION */}
      <section className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>
          Commencez en 4 étapes simples
        </h2>
        
        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <div key={index} className={styles.stepCard}>
              <div className={styles.stepNumber}>{step.number}</div>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}