'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ModalHistorialDocente.module.css';

interface HistorialItem {
  id: number;
  changeDate: string;
  changedBy: string;
  changedByRole: string;
  description: string;
}

interface Docente {
  id: number;
  name: string;
}

interface Props {
  docente: Docente;
  onClose: () => void;
}

export default function ModalHistorialDocente({ docente, onClose }: Props) {

  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  /* =======================================
     Accesibilidad: focus inicial del modal
  ======================================== */

  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  /* =======================================
     Cerrar con tecla ESC
  ======================================== */

  useEffect(() => {

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };

  }, [onClose]);

  /* =======================================
     Obtener historial
  ======================================== */

  useEffect(() => {

    const fetchHistorial = async () => {

      if (!docente?.id) return;

      setLoading(true);
      setError('');

      try {

        const res = await fetch(`/api/users/${docente.id}/history`);

        if (!res.ok) {
          throw new Error('Error al cargar historial');
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          setHistorial(data);
        } else {
          console.warn('Formato inesperado recibido:', data);
          setHistorial([]);
        }

      } catch (err) {

        console.error('Error al cargar historial:', err);
        setError('No se pudo cargar el historial.');

      } finally {

        setLoading(false);

      }

    };

    fetchHistorial();

  }, [docente]);

  return (

    <div
      className={styles.modalBackdrop}
      role="presentation"
    >

      <div
        ref={modalRef}
        className={styles.modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="historial-title"
        aria-describedby="historial-description"
        tabIndex={-1}
      >

        {/* HEADER */}

        <header className={styles.modalHeader}>

          <h2
            id="historial-title"
            className={styles.modalTitle}
          >
            Historial de cambios del docente
          </h2>

          <button
            type="button"
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Cerrar ventana de historial"
          >
            ✕
          </button>

        </header>

        <p
          id="historial-description"
          className={styles.srOnly}
        >
          Tabla con el historial de modificaciones realizadas al docente {docente.name}.
        </p>

        {/* BODY */}

        <section
          className={styles.modalBody}
          aria-live="polite"
        >

          {loading && (
            <p className={styles.statusText}>
              Cargando historial de cambios...
            </p>
          )}

          {error && (
            <p className={styles.errorText}>
              {error}
            </p>
          )}

          {!loading && !error && historial.length === 0 && (
            <p className={styles.statusText}>
              No existen registros de cambios para este docente.
            </p>
          )}

          {!loading && !error && historial.length > 0 && (

            <div className={styles.tableContainer}>

              <table className={styles.historyTable}>

                <caption className={styles.srOnly}>
                  Historial de modificaciones del docente
                </caption>

                <thead>

                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Responsable</th>
                    <th scope="col">Rol</th>
                    <th scope="col">Descripción</th>
                  </tr>

                </thead>

                <tbody>

                  {historial.map((item) => (

                    <tr key={item.id}>

                      <td>
                        {new Date(item.changeDate).toLocaleString()}
                      </td>

                      <td>
                        {item.changedBy}
                      </td>

                      <td>
                        {item.changedByRole}
                      </td>

                      <td>
                        {item.description}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* FOOTER */}

        <footer className={styles.modalFooter}>

          <button
            onClick={onClose}
            className={styles.primaryButton}
          >
            Cerrar
          </button>

        </footer>

      </div>

    </div>
  );
}