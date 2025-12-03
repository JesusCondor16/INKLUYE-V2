'use client';

import { useModalSeccion3Controller } from './ModalSeccion3.controller';
import styles from './ModalSeccion3.module.css';

interface ModalSeccion3Props {
  onClose: () => void;
}

export default function ModalSeccion3({ onClose }: ModalSeccion3Props) {
  const { loading, capacidades, programaciones } = useModalSeccion3Controller();

  if (loading) return <p>Cargando datos...</p>;

  // Contador global de semanas (correlativo a través de todas las filas)
  let weekCounter = 1;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-seccion3-title"
    >
      <div className={styles.modalContent}>
        {/* HEADER */}
        <header className={styles.modalHeader}>
          <h2 id="modal-seccion3-title" className={styles.modalTitle}>
            Sección de Capacidades y Programación de contenidos
          </h2>
          <button
            type="button"
            className={styles.btnClose}
            aria-label="Cerrar modal"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <div className={styles.modalBody}>
          <h2 className={styles.sectionTitle}>5. CAPACIDADES</h2>
          {capacidades.map((cap, i) => (
            <div key={i} className={styles.unidad}>
              <fieldset>
                <legend className={styles.unidadLegend}>Unidad {i + 1}</legend>
                <div className="mb-3">
                  <label htmlFor={`cap-nombre-${i}`} className="form-label">
                    Nombre de la unidad
                  </label>
                  <input
                    id={`cap-nombre-${i}`}
                    type="text"
                    className={`${styles.formControl} ${styles.disabledControl}`}
                    value={cap.nombre}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor={`cap-desc-${i}`} className="form-label">
                    Descripción
                  </label>
                  <textarea
                    id={`cap-desc-${i}`}
                    className={`${styles.formControl} ${styles.disabledControl} ${styles.preserveWhitespace}`}
                    rows={3}
                    value={cap.descripcion}
                    disabled
                  />
                </div>
              </fieldset>
            </div>
          ))}

          <h2 className={styles.sectionTitle}>6. PROGRAMACIÓN DE CONTENIDOS</h2>

          {programaciones.map((prog, i) => (
            <div key={i} className="mb-5">
              <h2>Unidad {i + 1}: {capacidades[i]?.nombre || '---'}</h2>

              <div className="mb-3">
                <label htmlFor={`logro-${i}`} className="form-label">
                  Logro de la unidad
                </label>
                <textarea
                  id={`logro-${i}`}
                  className={`${styles.formControl} ${styles.disabledControl} ${styles.preserveWhitespace}`}
                  rows={2}
                  value={prog.logroUnidad}
                  disabled
                />
              </div>

              <div className={styles.tableResponsive}>
                <table className={styles.table}>
                  <thead className={styles.tableHead}>
                    <tr>
                      <th className={styles.tableHeadCell}>Semana</th>
                      <th className={styles.tableHeadCell}>Contenido</th>
                      <th className={styles.tableHeadCell}>Actividades</th>
                      <th className={styles.tableHeadCell}>Recursos</th>
                      <th className={styles.tableHeadCell}>Estrategias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prog.filas.map((fila, j) => {
                      const semana = weekCounter++; // correlativo global
                      return (
                        <tr key={j}>
                          <td className={styles.tableBodyCell}>
                            <input
                              type="text"
                              className={`${styles.formControl} ${styles.disabledControl} text-center`}
                              value={String(semana)}
                              disabled
                              aria-label={`Semana ${semana}`}
                            />
                          </td>

                          {fila.fixed ? (
                            <td colSpan={4} className={`${styles.tableBodyCell} fw-bold bg-light ${styles.preserveWhitespace}`}>
                              {fila.contenido}
                            </td>
                          ) : (
                            <>
                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>{fila.contenido}</td>
                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>{fila.actividades}</td>
                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>{fila.recursos}</td>
                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>{fila.estrategias}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className={styles.modalFooter}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
}
