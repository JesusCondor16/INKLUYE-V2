'use client';

import { useModalSeccion4Controller } from './ModalSeccion4.controller';
import styles from './ModalSeccion4.module.css';

interface ModalSeccion4Props {
  cursoId: number;
  onClose: () => void;
}

export default function ModalSeccion4({ cursoId, onClose }: ModalSeccion4Props) {
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
  } = useModalSeccion4Controller(cursoId);

  return (
    <div
      className={`modal show d-block ${styles.overlay}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalTitle"
      aria-describedby="modalDescription"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered">

        <div className="modal-content">

          {/* HEADER */}
          <header className={`modal-header ${styles.header}`}>

            <h1 className="modal-title" id="modalTitle">
              7. Estrategia didáctica, 8. Recursos, 9. Evaluación y 10. Bibliografía
            </h1>

            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Cerrar ventana de edición de estrategia, recursos y bibliografía"
            />

          </header>

          {/* BODY */}
          <main className="modal-body" id="modalDescription">

            {/* ====================== */}
            {/* 7. ESTRATEGIA DIDÁCTICA */}
            {/* ====================== */}

            <section className="mb-4" aria-labelledby="estrategiaTitulo">

              <h2 id="estrategiaTitulo">
                7. Estrategia didáctica
              </h2>

              <label htmlFor="estrategiaTextarea" className={styles.visuallyHidden}>
                Estrategia didáctica del curso
              </label>

              <textarea
                id="estrategiaTextarea"
                className="form-control"
                rows={12}
                value={estrategia}
                disabled
                aria-readonly="true"
              />

            </section>

            {/* ====================== */}
            {/* 8. RECURSOS */}
            {/* ====================== */}

            <section className="mb-4" aria-labelledby="recursosTitulo">

              <h2 id="recursosTitulo">
                8. Recursos y materiales
              </h2>

              <label htmlFor="recursosTextarea" className={styles.visuallyHidden}>
                Recursos y materiales del curso
              </label>

              <textarea
                id="recursosTextarea"
                className="form-control"
                rows={6}
                value={recursos}
                disabled
                aria-readonly="true"
              />

            </section>

            {/* ====================== */}
            {/* 9. MATRIZ DE EVALUACIÓN */}
            {/* ====================== */}

            <section className="mb-4" aria-labelledby="evaluacionTitulo">

              <h2 id="evaluacionTitulo">
                9. Evaluación
              </h2>

              <div style={{ overflowX: 'auto' }}>

                <table
                  className="table table-bordered table-evaluacion"
                  role="table"
                  aria-label="Matriz de evaluación del curso"
                >

                  <thead>
                    <tr>
                      <th scope="col">Unidad de aprendizaje</th>
                      <th scope="col">Criterio y logros de aprendizaje</th>
                      <th scope="col">Procedimientos (Producto)</th>
                      <th scope="col">Instrumentos de evaluación</th>
                      <th scope="col">Peso (%)</th>
                      <th scope="col">Nota SUM</th>
                    </tr>
                  </thead>

                  <tbody>
                    {matriz.map((fila, index) => (
                      <tr key={index}>

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

              <div className="mt-3">

                <strong>
                  Nota Final: {notaFinalFormula}
                </strong>

              </div>

            </section>

            {/* ====================== */}
            {/* 10. BIBLIOGRAFÍA */}
            {/* ====================== */}

            <section className="mb-4" aria-labelledby="bibliografiaTitulo">

              <h2 id="bibliografiaTitulo">
                10. Bibliografía
              </h2>

              {bibliografia.map((item, index) => {

                const textareaId = `bibliografia-${index}`;

                return (

                  <div
                    key={index}
                    className="mb-2 d-flex gap-2 align-items-start"
                  >

                    <label
                      htmlFor={textareaId}
                      className={styles.visuallyHidden}
                    >
                      Bibliografía {index + 1}
                    </label>

                    <textarea
                      id={textareaId}
                      className="form-control"
                      rows={3}
                      value={item.texto}
                      maxLength={maxLength}
                      placeholder={`Bibliografía ${index + 1}`}
                      aria-label={`Bibliografía ${index + 1}`}
                      onChange={(e) =>
                        handleChangeBibliografia(index, e.target.value)
                      }
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
                aria-label="Agregar una nueva referencia bibliográfica"
              >
                + Agregar bibliografía
              </button>

            </section>

          </main>

          {/* FOOTER */}

          <footer className="modal-footer">

            <button
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cerrar
            </button>

            <button
              className="btn btn-success"
              onClick={handleGuardarBibliografia}
              disabled={loading}
              aria-label="Guardar cambios de bibliografía"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>

          </footer>

        </div>
      </div>
    </div>
  );
}