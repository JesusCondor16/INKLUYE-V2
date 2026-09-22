'use client';

import { useModalSeccion3Controller } from './ModalSeccion3.controller';
import styles from './ModalSeccion3.module.css';

interface ModalSeccion3Props {
  cursoId: number;
  onClose: () => void;
}

export default function ModalSeccion3({ cursoId, onClose }: ModalSeccion3Props) {
  const { loading, capacidades, programaciones } = useModalSeccion3Controller(cursoId);

  if (loading) {
    return <p role="status">Cargando datos...</p>;
  }

  let weekCounter = 1;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-seccion3-title"
      aria-describedby="modal-seccion3-description"
      tabIndex={-1}
    >
      <div className={styles.modalContent}>

        {/* HEADER */}
        <header className={styles.modalHeader}>
           <h2
            id="modal-seccion3-title"
            className={styles.modalTitle}
          >
            Sección de Capacidades y Programación de Contenidos
          </h2>

          <button
            type="button"
            className={styles.btnClose}
            aria-label="Cerrar ventana"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* BODY */}
        <main
          className={styles.modalBody}
          id="modal-seccion3-description"
        >

          {/* ===================== */}
          {/* 5. CAPACIDADES */}
          {/* ===================== */}

          <h2 className={styles.sectionTitle}>
            5. Capacidades
          </h2>

          {capacidades.map((cap, i) => (
            <section key={i} className={styles.unidad}>

              <fieldset>

                <legend className={styles.unidadLegend}>
                  Unidad {i + 1}
                </legend>

                <div>

                  <label htmlFor={`cap-nombre-${i}`}>
                    Nombre de la unidad
                  </label>

                  <input
                    id={`cap-nombre-${i}`}
                    type="text"
                    className={`${styles.formControl} ${styles.disabledControl}`}
                    value={cap.nombre}
                    disabled
                    aria-readonly="true"
                  />

                </div>

                <div style={{ marginTop: '12px' }}>

                  <label htmlFor={`cap-desc-${i}`}>
                    Descripción
                  </label>

                  <textarea
                    id={`cap-desc-${i}`}
                    rows={3}
                    className={`${styles.formControl} ${styles.disabledControl} ${styles.preserveWhitespace}`}
                    value={cap.descripcion}
                    disabled
                    aria-readonly="true"
                  />

                </div>

              </fieldset>

            </section>
          ))}

          {/* ===================== */}
          {/* 6. PROGRAMACIÓN */}
          {/* ===================== */}

          <h2 className={styles.sectionTitle}>
            6. Programación de contenidos
          </h2>

          {programaciones.map((prog, i) => (
            <section key={i} style={{ marginBottom: '32px' }}>

              <h3>
                Unidad {i + 1}: {capacidades[i]?.nombre || '---'}
              </h3>

              <div style={{ marginTop: '12px', marginBottom: '16px' }}>

                <label htmlFor={`logro-${i}`}>
                  Logro de la unidad
                </label>

                <textarea
                  id={`logro-${i}`}
                  rows={2}
                  className={`${styles.formControl} ${styles.disabledControl} ${styles.preserveWhitespace}`}
                  value={prog.logroUnidad}
                  disabled
                  aria-readonly="true"
                />

              </div>

              {/* TABLA */}

              <div className={styles.tableResponsive}>

                <table className={styles.table}>

                  <thead className={styles.tableHead}>
                    <tr>

                      <th scope="col" className={styles.tableHeadCell}>
                        Semana
                      </th>

                      <th scope="col" className={styles.tableHeadCell}>
                        Contenido
                      </th>

                      <th scope="col" className={styles.tableHeadCell}>
                        Actividades
                      </th>

                      <th scope="col" className={styles.tableHeadCell}>
                        Recursos
                      </th>

                      <th scope="col" className={styles.tableHeadCell}>
                        Estrategias
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {prog.filas.map((fila, j) => {

                      const semana = weekCounter++;

                      return (

                        <tr key={j}>

                          <td className={styles.tableBodyCell}>

                            <input
                              type="text"
                              value={String(semana)}
                              disabled
                              aria-label={`Semana ${semana}`}
                              className={`${styles.formControl} ${styles.disabledControl}`}
                            />

                          </td>

                          {fila.fixed ? (

                            <td
                              colSpan={4}
                              className={`${styles.tableBodyCell} ${styles.fixedRow} ${styles.preserveWhitespace}`}
                            >
                              {fila.contenido}
                            </td>

                          ) : (

                            <>
                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>
                                {fila.contenido}
                              </td>

                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>
                                {fila.actividades}
                              </td>

                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>
                                {fila.recursos}
                              </td>

                              <td className={`${styles.tableBodyCell} ${styles.preserveWhitespace}`}>
                                {fila.estrategias}
                              </td>
                            </>

                          )}

                        </tr>

                      );

                    })}

                  </tbody>

                </table>

              </div>

            </section>
          ))}

        </main>

        {/* FOOTER */}

        <footer className={styles.modalFooter}>

          <button
            type="button"
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onClose}
          >
            Cerrar
          </button>

        </footer>

      </div>
    </div>
  );
}