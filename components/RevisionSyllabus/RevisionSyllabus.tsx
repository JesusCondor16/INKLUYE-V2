'use client';

import { useRef, useState } from 'react';
import styles from './RevisionSyllabus.module.css';
import { useRevisionSyllabusController } from './RevisionSyllabus.controller';
import type { SyllabusPendiente } from './RevisionSyllabus.model';
import ModalDevolverSyllabus from './ModalDevolverSyllabus';

export default function RevisionSyllabus() {
  const { pendientes, loading, procesandoId, mensaje, error, publicar, devolver } =
    useRevisionSyllabusController();
  const [cursoADevolver, setCursoADevolver] = useState<SyllabusPendiente | null>(null);
  // Boton que abrio el modal, para devolverle el foco al cerrarlo (WCAG 2.4.3)
  const disparadorRef = useRef<HTMLButtonElement | null>(null);

  const abrirDevolver = (curso: SyllabusPendiente, boton: HTMLButtonElement) => {
    disparadorRef.current = boton;
    setCursoADevolver(curso);
  };

  const cerrarDevolver = () => {
    setCursoADevolver(null);
    disparadorRef.current?.focus();
  };

  const confirmarDevolver = async (observacion: string) => {
    if (!cursoADevolver) return;
    const ok = await devolver(cursoADevolver, observacion);
    if (ok) {
      // La fila desaparece de la lista, asi que el foco vuelve al titulo de la pagina
      setCursoADevolver(null);
      document.getElementById('page-title')?.focus();
    }
  };

  return (
    <>
      {/* Mensajes anunciados por lectores de pantalla (WCAG 4.1.3) */}
      <p role="status" aria-live="polite" className={styles.mensaje}>{mensaje}</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}

      {loading && pendientes.length === 0 && <p>Cargando syllabus por revisar...</p>}

      {!loading && pendientes.length === 0 && (
        <p>No tienes syllabus pendientes de revisión.</p>
      )}

      {pendientes.length > 0 && (
        <table className={styles.table}>
          <caption className={styles.caption}>
            Syllabus enviados por los coordinadores de los cursos que dictas
          </caption>
          <thead>
            <tr>
              <th scope="col">Código</th>
              <th scope="col">Curso</th>
              <th scope="col">Coordinador</th>
              <th scope="col">Enviado</th>
              <th scope="col">Syllabus</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.coordinador}</td>
                <td>
                  {c.enviadoEn ? (
                    <time dateTime={c.enviadoEn}>{new Date(c.enviadoEn).toLocaleString('es-PE')}</time>
                  ) : '—'}
                </td>
                <td>
                  {c.pdfUrl ? (
                    <a
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.enlace}
                    >
                      Ver PDF<span className={styles.visuallyHidden}> de {c.name} (abre en otra pestaña)</span>
                    </a>
                  ) : 'No disponible'}
                </td>
                <td>
                  <div className={styles.acciones}>
                    <button
                      type="button"
                      className={styles.btnPrimario}
                      onClick={() => publicar(c)}
                      disabled={procesandoId === c.id}
                      aria-label={`Publicar syllabus de ${c.name}`}
                    >
                      Publicar
                    </button>
                    <button
                      type="button"
                      className={styles.btnPeligro}
                      onClick={(e) => abrirDevolver(c, e.currentTarget)}
                      disabled={procesandoId === c.id}
                      aria-label={`Devolver syllabus de ${c.name} con observaciones`}
                    >
                      Devolver
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {cursoADevolver && (
        <ModalDevolverSyllabus
          curso={cursoADevolver}
          enviando={procesandoId === cursoADevolver.id}
          onConfirmar={confirmarDevolver}
          onClose={cerrarDevolver}
        />
      )}
    </>
  );
}
