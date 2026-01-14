// src/components/SuccessCard.jsx
import React, { useEffect } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";
import styles from "./SuccessCard.module.css";

export default function SuccessCard({ message = "Opération réussie", onClose }) {
  // auto close after 4.5s
  useEffect(() => {
    const t = setTimeout(() => {
      if (onClose) onClose();
    }, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={styles.overlay} role="dialog" aria-live="polite" aria-modal="true">
      <div className={styles.card}>
        <button className={styles.closeBtn} aria-label="Fermer" onClick={onClose}>
          <FaTimes />
        </button>

        <div className={styles.header}>
          <FaCheckCircle className={styles.icon} />
          <h3 className={styles.title}>Succès</h3>
        </div>

        <p className={styles.message}>{message}</p>

        <div className={styles.actions}>
          <button className={styles.okBtn} onClick={onClose}>OK</button>
        </div>
      </div>
    </div>
  );
}
