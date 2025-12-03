'use client';

import { useModalSeccion4Controller } from './ModalSeccion4.controller';
import styles from './ModalSeccion4.module.css';

interface ModalSeccion4Props {
  onClose: () => void;
}

export default function ModalSeccion4({ onClose }: ModalSeccion4Props) {
  const {
    estrategia,
    recursos,
    bibliografia,
    matriz,
    notaFinalFormula,
    loading,
    maxLength,
    handleChangeBibliografia,
    handleAddBibliografia,
    handleRemoveBibliografia,
    handleGuardarBibliografia,
  } = useModalSeccion4Controller();

  return (
    <div
      className={`modal show d-block ${styles.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalDescription"
    >
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className={`modal-header ${styles.header}`}>
            <h2 className="modal-title" id="modalTitle">
              7. Estrategia didáctica, 8. Recursos, 9. Evaluación y 10. Bibliografía
            </h2>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Cerrar modal"
            />
          </div>

          <div className="modal-body" id="modalDescription">
            {/* Estrategia */}
            <section className="mb-4">
              <h2>7. Estrategia didáctica</h2>
              <textarea
                className="form-control"
                rows={12}
                value={estrategia}
                disabled
                aria-label="Estrategia didáctica"
              />
            </section>

            {/* Recursos */}
            <section className="mb-4">
              <h2>8. Recursos y materiales</h2>
              <textarea
                className="form-control"
                rows={6}
                value={recursos}
                disabled
                aria-label="Recursos y materiales"
              />
            </section>

            {/* Evaluación */}
            <section className="mb-4">
              <h2>9. Evaluación</h2>
              <div style={{ overflowX: 'auto' }}>
                <table
                  className="table table-bordered table-striped table-evaluacion"
                  role="table"
                  aria-label="Matriz de evaluación del curso"
                >
                  <thead>
                    <tr>
                      <th scope="col">Unidad de aprendizaje</th>
                      <th scope="col">Criterio y logros de aprendizaje</th>
                      <th scope="col">Procedimientos (Producto)</th>
                      <th scope="col">Instrumentos de Evaluación</th>
                      <th scope="col">Peso (%)</th>
                      <th scope="col">Nota SUM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriz.map((fila, i) => (
                      <tr key={i}>
                        <td>{fila.unidad}</td>
                        <td>{fila.criterio}</td>
                        <td>{fila.producto}</td>
                        <td>{fila.instrumento}</td>
                        <td>{fila.nota_peso}</td>
                        <td>{fila.nota_sum}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h2>Nota Final: {notaFinalFormula}</h2>
            </section>

            {/* Bibliografía */}
            <section className="mb-4">
              <h2>10. Bibliografía</h2>

              {bibliografia.map((item, index) => {
                const textareaId = `bib-${index}`;
                return (
                  <div key={index} className="mb-2 d-flex gap-2 align-items-start">
                    {/* Label accesible pero oculto visualmente */}
                    <label htmlFor={textareaId} className={styles.visuallyHidden}>
                      Bibliografía {index + 1}
                    </label>

                    <textarea
                      id={textareaId}
                      className="form-control"
                      value={item.texto}
                      rows={3}
                      maxLength={maxLength}
                      onChange={(e) => handleChangeBibliografia(index, e.target.value)}
                      placeholder={`Bibliografía ${index + 1}`}
                      aria-label={`Bibliografía ${index + 1}`}
                    />

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveBibliografia(index)}
                      aria-label={`Eliminar bibliografía ${index + 1}`}
                      title={`Eliminar bibliografía ${index + 1}`}
                    >
                      🗑
                    </button>
                  </div>
                );
              })}

              <button
                type="button"
                className="btn btn-primary mb-3"
                onClick={handleAddBibliografia}
                aria-label="Agregar bibliografía"
                title="Agregar bibliografía"
              >
                + Agregar bibliografía
              </button>

            </section>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cerrar
            </button>
            <button
              className="btn btn-success"
              onClick={handleGuardarBibliografia}
              disabled={loading}
              aria-label="Guardar bibliografía"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
