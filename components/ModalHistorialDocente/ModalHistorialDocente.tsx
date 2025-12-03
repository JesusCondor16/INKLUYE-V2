'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchHistorial = async () => {
      if (!docente?.id) return;
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/users/${docente.id}/history`);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || 'Error al cargar historial');
        }
        const data = await res.json();
        setHistorial(data);
      } catch (err: any) {
        console.error('Error al cargar historial:', err);
        setError('No se pudo cargar el historial');
      } finally {
        setLoading(false);
      }
    };

    fetchHistorial();
  }, [docente]);

  return (
    <div className={styles.modalBackdrop} role="dialog" aria-modal="true">
      <div className={`${styles.modalContent} modal-lg`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            Historial de cambios: {docente.name}
          </h5>
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={onClose}
            aria-label="Cerrar"
          />
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {loading ? (
            <p>Cargando historial...</p>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : historial.length === 0 ? (
            <p>No hay historial disponible.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover align-middle text-center">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Responsable</th>
                    <th>Rol</th>
                    <th>Descripción</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(item => (
                    <tr key={item.id}>
                      <td>{new Date(item.changeDate).toLocaleString()}</td>
                      <td>{item.changedBy}</td>
                      <td>{item.changedByRole.charAt(0).toUpperCase() + item.changedByRole.slice(1)}</td>
                      <td>{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
