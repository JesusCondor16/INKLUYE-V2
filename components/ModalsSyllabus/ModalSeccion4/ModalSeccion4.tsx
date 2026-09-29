'use client';

import type { BibliografiaCategoria } from '@prisma/client';
import { Plus, Trash2, X } from 'lucide-react';
import { useModalSeccion4Controller, CATEGORIAS_BIBLIOGRAFIA } from './ModalSeccion4.controller';
import styles from './ModalSeccion4.module.css';
import { useDialogoAccesible } from '@/hooks/useDialogoAccesible';

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
    handleChangeBibliografiaCategoria,
    handleAddBibliografia,
    handleRemoveBibliografia,
    handleGuardarBibliografia,
  } = useModalSeccion4Controller(cursoId);
  const dialogoRef = useDialogoAccesible<HTMLDivElement>(onClose);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        ref={dialogoRef}
        tabIndex={-1}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-seccion4-title"
      >
        {/* HEADER */}
        <header className={styles.header}>
          <h2 id="modal-seccion4-title" className={styles.modalTitle}>
            Estrategia, Recursos, Evaluación y Bibliografía
          </h2>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Cerrar ventana de estrategia, recursos, evaluación y bibliografía"
          >
            <X size={22} aria-hidden="true" focusable={false} />
          </button>
        </header>

        {/* BODY (div y no <main>: la pagina ya tiene su region principal) */}
        <div className={styles.body}>

          {/* 7. ESTRATEGIA DIDÁCTICA */}
          <section className={styles.section} aria-labelledby="estrategiaTitulo">
            <h3 id="estrategiaTitulo" className={styles.sectionTitle}>
              7. Estrategia didáctica
            </h3>

            <label htmlFor="estrategiaTextarea" className={styles.visuallyHidden}>
              Estrategia didáctica del curso
            </label>
            <textarea
              id="estrategiaTextarea"
              className={styles.control}
              rows={12}
              value={estrategia}
              readOnly
            />
          </section>

          {/* 8. RECURSOS */}
          <section className={styles.section} aria-labelledby="recursosTitulo">
            <h3 id="recursosTitulo" className={styles.sectionTitle}>
              8. Recursos y materiales
            </h3>

            <label htmlFor="recursosTextarea" className={styles.visuallyHidden}>
              Recursos y materiales del curso
            </label>
            <textarea
              id="recursosTextarea"
              className={styles.control}
              rows={6}
              value={recursos}
              readOnly
            />
          </section>

          {/* 9. MATRIZ DE EVALUACIÓN */}
          <section className={styles.section} aria-labelledby="evaluacionTitulo">
            <h3 id="evaluacionTitulo" className={styles.sectionTitle}>
              9. Evaluación
            </h3>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <caption className={styles.visuallyHidden}>Matriz de evaluación del curso</caption>
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

            <p className={styles.notaFinal}>Nota Final: {notaFinalFormula}</p>
          </section>

          {/* 10. BIBLIOGRAFÍA */}
          <section className={styles.section} aria-labelledby="bibliografiaTitulo">
            <h3 id="bibliografiaTitulo" className={styles.sectionTitle}>
              10. Bibliografía
            </h3>

            {bibliografia.map((item, index) => {
              const textareaId = `bibliografia-${index}`;
              const selectId = `bibliografia-categoria-${index}`;

              return (
                <div key={index} className={styles.bibliografiaItem}>
                  <label htmlFor={selectId} className={styles.visuallyHidden}>
                    Categoría de la bibliografía {index + 1}
                  </label>
                  <select
                    id={selectId}
                    className={styles.control}
                    value={item.categoria}
                    onChange={(e) =>
                      handleChangeBibliografiaCategoria(index, e.target.value as BibliografiaCategoria)
                    }
                  >
                    {CATEGORIAS_BIBLIOGRAFIA.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>

                  <div className={styles.bibliografiaFila}>
                    <label htmlFor={textareaId} className={styles.visuallyHidden}>
                      Bibliografía {index + 1}
                    </label>
                    <textarea
                      id={textareaId}
                      className={styles.control}
                      rows={3}
                      value={item.texto}
                      maxLength={maxLength}
                      placeholder={`Bibliografía ${index + 1}`}
                      onChange={(e) => handleChangeBibliografia(index, e.target.value)}
                    />

                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() => handleRemoveBibliografia(index)}
                      aria-label={`Eliminar bibliografía ${index + 1}`}
                      title={`Eliminar bibliografía ${index + 1}`}
                    >
                      <Trash2 size={20} aria-hidden="true" focusable={false} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button type="button" className={styles.buttonPrimary} onClick={handleAddBibliografia}>
              <Plus size={18} aria-hidden="true" focusable={false} />
              Agregar bibliografía
            </button>
          </section>
        </div>

        {/* FOOTER */}
        <footer className={styles.footer}>
          <button type="button" className={styles.buttonSecondary} onClick={onClose} disabled={loading}>
            Cerrar
          </button>

          <button
            type="button"
            className={styles.buttonSuccess}
            onClick={handleGuardarBibliografia}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Guardando...' : 'Guardar bibliografía'}
          </button>
        </footer>
      </div>
    </div>
  );
}
