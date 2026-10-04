'use client';

import { useDialogoAccesible } from '@/hooks/useDialogoAccesible';
import styles from './ModalCerrarSesion.module.css';

interface Props {
  id: string; // <-- necesario para aria-controls en el Sidebar
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  // Permite reutilizar el dialogo para otras confirmaciones (p. ej. eliminar un docente)
  textoConfirmar?: string;
}

export default function ModalCerrarSesion({
  id,
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  textoConfirmar = 'Sí, cerrar sesión'
}: Props) {
  // Foco inicial en "Cancelar" (la opcion segura), Escape, trampa de Tab y, al cerrar,
  // el foco vuelve al boton que abrio el dialogo. Antes este componente tenia su propia
  // version y no devolvia el foco (quedaba en <body>).
  const modalRef = useDialogoAccesible<HTMLDivElement>(onCancel, isOpen);

  if (!isOpen) return null;

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
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            Cancelar
          </button>

          <button
            type="button"
            className={styles.btnDanger}
            onClick={onConfirm}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
