'use client';

import { useState } from 'react';
import ModalCerrarSesion from '@/components/ModalCerrarSesion/ModalCerrarSesion';
import styles from './EstadoSyllabus.module.css';
import { useEstadoSyllabusController } from './EstadoSyllabus.controller';
import { DESCRIPCION_ESTADO, ETIQUETA_ACCION, ETIQUETA_ESTADO } from './EstadoSyllabus.model';
import IdiomasSyllabus from '@/components/IdiomasSyllabus/IdiomasSyllabus';
import { Sigla } from '@/components/Glosario/Glosario';

interface Props {
  cursoId: number;
  nombreCurso: string;
  recargarKey: number;
}

const CLASE_ESTADO = {
  BORRADOR: styles.badgeBorrador,
  ENVIADO_DOCENTE: styles.badgeEnviado,
  PUBLICADO: styles.badgePublicado,
};

export default function EstadoSyllabus({ cursoId, nombreCurso, recargarKey }: Props) {
  const { estado, historial, idiomas, loading, enviando, mensaje, error, enviarADocentes } =
    useEstadoSyllabusController(cursoId, recargarKey);
  // WCAG 2.1 - 3.3.6 (AAA): el envio se confirma antes de ejecutarse
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);

  return (
    <section className={styles.panel} aria-labelledby="estado-syllabus-title">
      <h2 id="estado-syllabus-title" className={styles.title}>Estado del syllabus</h2>

      {/* Mensajes de estado anunciados por lectores de pantalla (WCAG 4.1.3) */}
      <p role="status" aria-live="polite" className={styles.mensaje}>{mensaje}</p>
      {error && <p role="alert" className={styles.error}>{error}</p>}

      {loading && !estado && <p>Cargando estado...</p>}

      {!loading && !estado && !error && (
        <p>Aún no se ha generado el syllabus. Genera el PDF para poder enviarlo a los docentes.</p>
      )}

      {estado && (
        <>
          <p className={styles.estadoLinea}>
            Estado actual:{' '}
            <span className={`${styles.badge} ${CLASE_ESTADO[estado]}`}>{ETIQUETA_ESTADO[estado]}</span>
          </p>
          <p className={styles.descripcion}>{DESCRIPCION_ESTADO[estado]}</p>

          {idiomas.length > 0 && (
            <>
              <h3 className={styles.subtitle}><Sigla id="pdf" /> generados</h3>
              <IdiomasSyllabus idiomas={idiomas} nombreCurso={nombreCurso} mostrarFechas />
            </>
          )}

          {estado === 'BORRADOR' && (
            <button
              type="button"
              className={styles.btn}
              onClick={() => setConfirmarEnvio(true)}
              disabled={enviando}
              aria-busy={enviando}
            >
              {enviando ? 'Enviando...' : 'Enviar a docentes para revisión'}
            </button>
          )}
        </>
      )}

      {historial.length > 0 && (
        <>
          <h3 className={styles.subtitle}>Historial</h3>
          <ol className={styles.historial}>
            {historial.map((h) => (
              <li key={h.id} className={styles.historialItem}>
                <p className={styles.historialCabecera}>
                  <strong>{ETIQUETA_ACCION[h.accion]}</strong>
                  {' — '}
                  {h.usuario.name}
                  {' — '}
                  <time dateTime={h.fecha}>{new Date(h.fecha).toLocaleString('es-PE')}</time>
                </p>
                {h.observacion && (
                  <blockquote className={styles.observacion}>
                    <span className={styles.visuallyHidden}>Observaciones: </span>
                    {h.observacion}
                  </blockquote>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
      {confirmarEnvio && (
        <ModalCerrarSesion
          id="modal-confirmar-envio"
          isOpen
          title="Enviar syllabus a revisión"
          description={`Se enviará el syllabus de ${nombreCurso} a los docentes del curso. Mientras esté en revisión no podrá enviarlo de nuevo. ¿Desea continuar?`}
          textoConfirmar="Sí, enviar"
          onCancel={() => setConfirmarEnvio(false)}
          onConfirm={() => {
            setConfirmarEnvio(false);
            enviarADocentes();
          }}
        />
      )}
    </section>
  );
}