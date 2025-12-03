'use client';

import React from 'react';
import styles from './ModalSeccion1.module.css';
import { useModalSeccion1Controller } from './ModalSeccion1.controller';

interface ModalSeccion1Props {
  show: boolean;
  onClose: () => void;
  cursoId: number;
}

export default function ModalSeccion1({ show, onClose, cursoId }: ModalSeccion1Props) {
  const { curso, sumilla, loading, textareaRef } = useModalSeccion1Controller(cursoId);

  if (!show) return null;

  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!target.closest(`.${styles.modalContainer}`)) {
      onClose();
    }
  };

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOutsideClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalDescription"
    >
      <div className={styles.modalContainer}>
        <header className={styles.modalHeader}>
          <h2 id="modalTitle">1. Información general del curso</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {loading ? (
          <p className={styles.loadingText}>Cargando datos...</p>
        ) : (
          <div className={styles.modalBody}>
            <dl className={styles.datalist}>
              <dt>1.1 Nombre:</dt>
              <dd>{curso?.name || '—'}</dd>

              <dt>1.2 Código:</dt>
              <dd>{curso?.code || '—'}</dd>

              <dt>1.3 Tipo:</dt>
              <dd>{curso?.type || '—'}</dd>

              <dt>1.4 Área de estudios:</dt>
              <dd>{curso?.area || '—'}</dd>

              <dt>1.5 Semanas:</dt>
              <dd>{curso?.weeks || '—'}</dd>

              <dt>1.6 Horas semanales:</dt>
              <dd>
                Teoría: {curso?.theoryHours ?? 0}, Laboratorio: {curso?.labHours ?? 0}, Práctica: {curso?.practiceHours ?? 0}
              </dd>

              <dt>1.7 Semestre:</dt>
              <dd>{curso?.semester || '—'}</dd>

              <dt>1.8 Ciclo:</dt>
              <dd>{curso?.cycle || '—'}</dd>

              <dt>1.9 Créditos:</dt>
              <dd>{curso?.credits || '—'}</dd>

              <dt>1.10 Modalidad:</dt>
              <dd>{curso?.modality || '—'}</dd>

              <dt>1.11 Pre-requisitos:</dt>
              <dd>
                {curso?.prerequisites?.length
                  ? curso.prerequisites.map(p => p.prerequisite?.name).join(', ')
                  : '—'}
              </dd>

              <dt>1.12 Docente(s):</dt>
              <dd>
                {curso?.cursoDocentes?.length
                  ? curso.cursoDocentes.map(d => d.user?.name).join(', ')
                  : '—'}
              </dd>

              <dt>1.13 Coordinador:</dt>
              <dd>{curso?.coordinador?.name || '—'}</dd>
            </dl>

            <hr className={styles.separator} />
            <h3 id="modalDescription">2. Sumilla</h3>

            <textarea
              ref={textareaRef}
              className={styles.textarea}
              rows={6}
              maxLength={2000}
              value={sumilla}
              readOnly
              aria-label="Sumilla del curso"
            />
            <div className={styles.charCount}>{sumilla.length}/2000 caracteres</div>

            <div className={styles.buttonContainer}>
              <button type="button" onClick={onClose} className={styles.buttonSecondary}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
