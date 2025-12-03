'use client';

import { useEffect, useRef } from 'react';
import styles from './ModalCerrarSesion.module.css';

interface Props {
  id: string; // <-- necesario para aria-controls en el Sidebar
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ModalCerrarSesion({
  id,
  isOpen,
  title,
  description,
  onConfirm,
  onCancel
}: Props) {
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  if (!isOpen) return null;

  /* -------------------- FOCUS AL ABRIR -------------------- */
  useEffect(() => {
    cancelBtnRef.current?.focus();
  }, []);

  /* -------------------- CERRAR CON ESC -------------------- */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      // Trampa de foco mínima WCAG AAA
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab normal
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onCancel]);

  return (
    <div
      id={id}
      className={styles.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
    >
      <div className={styles.modalContent} ref={modalRef}>

        <div className={styles.modalHeader}>
          <h2 id={`${id}-title`} className={styles.modalTitle}>
            {title}
          </h2>
        </div>

        <div className={styles.modalBody}>
          <p id={`${id}-desc`}>{description}</p>
        </div>

        <div className={styles.modalFooter}>
          <button
            ref={cancelBtnRef}
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Sí, cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
