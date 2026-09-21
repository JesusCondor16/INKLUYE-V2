'use client';

import React from 'react';
import styles from './ModalSeccion2.module.css';
import { useModalSeccion2Controller } from './ModalSeccion2.controller';
import { Competencia, Logro } from './ModalSeccion2.model';

interface ModalSeccion2Props {
  cursoId: number;
  onClose: () => void;
}

export default function ModalSeccion2({ cursoId, onClose }: ModalSeccion2Props) {

  const { competenciasCurso, logros, loading } = useModalSeccion2Controller(cursoId);

  if (loading) {
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContainer}>
          <p className={styles.loadingText}>Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
    >
      <div className={styles.modalContainer}>

        {/* HEADER */}
        <div className={styles.modalHeader}>

          <h2 id="modalTitle" className={styles.modalTitle}>
            3. Competencias del perfil de egreso
          </h2>

          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar modal"
          >
            ✕
          </button>

        </div>

        {/* BODY */}
        <div className={styles.modalBody}>

          {/* TABLA COMPETENCIAS */}
          <div className={styles.tableWrapper}>

            <table className={styles.table}>

              <thead className={styles.tableHeaderPrimary}>
                <tr>
                  <th scope="col">Código</th>
                  <th scope="col">Descripción</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Nivel</th>
                </tr>
              </thead>

              <tbody>
                {competenciasCurso.length > 0 ? (
                  competenciasCurso.map((c: Competencia, i) => (
                    <tr key={i}>
                      <td>{c.codigo}</td>
                      <td>{c.descripcion}</td>
                      <td>{c.tipo}</td>
                      <td>{c.nivel}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyRow}>
                      No hay competencias registradas
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>

          {/* LOGROS */}
          <h3 className={styles.sectionTitle}>
            4. Logros de aprendizaje
          </h3>

          <div className={styles.tableWrapper}>

            <table className={styles.table}>

              <thead className={styles.tableHeaderSuccess}>
                <tr>
                  <th scope="col" style={{ width: '20%' }}>
                    Código
                  </th>

                  <th scope="col" style={{ width: '80%' }}>
                    Descripción
                  </th>
                </tr>
              </thead>

              <tbody>
                {logros.length > 0 ? (
                  logros.map((logro: Logro, i) => (
                    <tr key={i}>
                      <td>{logro.codigo}</td>
                      <td>{logro.descripcion}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className={styles.emptyRow}>
                      No hay logros registrados
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>

        </div>

        {/* FOOTER */}
        <div className={styles.modalFooter}>

          <button
            className={styles.buttonSecondary}
            onClick={onClose}
          >
            Cerrar
          </button>

        </div>

      </div>
    </div>
  );
}