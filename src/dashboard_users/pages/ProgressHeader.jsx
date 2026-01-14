import React from "react";
import styles from "./ProgressHeader.module.css";

/* =========================
   TOUTES LES ÉTAPES
   ========================= */
const ALL_STEPS = [
  "Informations générales",
  "Localisation",
  "Caractéristiques",
  "Documents",
  "Accessibilité",
  "Commodités",
  "Conditions de paie & bonus",
  "Médias",
  "Récapitulatif",
];

/* Étapes supprimées pour Terrain */
const SKIPPED_STEPS_FOR_TERRAIN = [3, 4, 5];

const ProgressHeader = ({ currentStep, isTerrain }) => {
  /* =========================
     ÉTAPES VISIBLES
     ========================= */
  const visibleSteps = ALL_STEPS.filter(
    (_, index) =>
      !isTerrain ||
      !SKIPPED_STEPS_FOR_TERRAIN.includes(index + 1)
  );

  /* =========================
     INDEX RÉEL
     ========================= */
  const currentLabel = ALL_STEPS[currentStep - 1];

  const visibleIndex = visibleSteps.findIndex(
    (label) => label === currentLabel
  );

  const displayStep = visibleIndex + 1;
  const displayTotal = visibleSteps.length;

  return (
    <div className={styles.headerWrapper}>
      <h1 className={styles.title}>
        Étape {displayStep} / {displayTotal} –{" "}
        <span className={styles.stepName}>{currentLabel}</span>
      </h1>

      <div className={styles.divider} />

      <div className={styles.currentStep}>
        <div className={styles.stepNumberActive}>
          {displayStep}
        </div>
        <span className={styles.stepLabelActive}>
          {currentLabel}
        </span>
      </div>
    </div>
  );
};

export default ProgressHeader;
