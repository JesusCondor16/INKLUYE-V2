'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './RevisionSyllabus.module.css';
import { MAX_OBSERVACION, type SyllabusPendiente } from './RevisionSyllabus.model';

interface Props {
  curso: SyllabusPendiente;
  enviando: boolean;
  onConfirmar: (observacion: string) => void;
  onClose: () => void;
}

export default function ModalDevolverSyllabus({ curso, enviando, onConfirmar, onClose }: Props) {
  const [observacion, setObservacion] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Foco inicial en el campo de observaciones
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // ESC cierra y Tab no sale del modal (WCAG 2.1.2 / 2.4.3)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'textarea, button:not([disabled])',
      );
      if (focusables.length === 0) return;
      const primero = focusables[0];
      const ultimo = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observacion.trim()) {
      setErrorLocal('Escribe las observaciones para el coordinador.');
      textareaRef.current?.focus();
      return;
    }
    setErrorLocal('');
    onConfirmar(observacion.trim());
  };

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="devolver-title"
        aria-describedby="devolver-desc"
      >
        <h2 id="devolver-title" className={styles.dialogTitle}>Devolver syllabus</h2>
        <p id="devolver-desc">
          El syllabus de <strong>{curso.name}</strong> volverá a borrador y el coordinador ({curso.coordinador})
          recibirá tus observaciones.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="observacion" className={styles.label}>
            Observaciones (obligatorio)
          </label>
          <textarea
            id="observacion"
            ref={textareaRef}
            className={styles.textarea}
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            maxLength={MAX_OBSERVACION}
            rows={6}
            required
            aria-required="true"
            aria-invalid={!!errorLocal}
            aria-describedby={errorLocal ? 'observacion-error observacion-contador' : 'observacion-contador'}
          />
          <p id="observacion-contador" className={styles.contador}>
            {observacion.length} de {MAX_OBSERVACION} caracteres
          </p>
          {errorLocal && (
            <p id="observacion-error" role="alert" className={styles.error}>{errorLocal}</p>
          )}

          <div className={styles.dialogAcciones}>
            <button type="button" className={styles.btnSecundario} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnPeligro} disabled={enviando} aria-busy={enviando}>
              {enviando ? 'Devolviendo...' : 'Devolver al coordinador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
