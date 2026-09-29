'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import styles from './Notificaciones.module.css';
import { useNotificacionesController } from './Notificaciones.controller';

// Patron "disclosure" de WAI-ARIA: boton con aria-expanded que muestra/oculta el panel
export default function Notificaciones() {
  const { notificaciones, noLeidas, anuncio, marcarLeida, marcarTodasLeidas } = useNotificacionesController();
  const [abierto, setAbierto] = useState(false);
  const botonRef = useRef<HTMLButtonElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);

  const cerrar = () => {
    setAbierto(false);
    botonRef.current?.focus();
  };

  // "Marcar todas" desaparece al no quedar pendientes: el foco pasa a "Cerrar" para no perderse (WCAG 2.4.3)
  const handleMarcarTodas = async () => {
    await marcarTodasLeidas();
    cerrarRef.current?.focus();
  };

  return (
    <div className={styles.contenedor}>
      {/* Avisos de notificaciones nuevas para lectores de pantalla (WCAG 4.1.3) */}
      <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{anuncio}</p>

      <button
        ref={botonRef}
        type="button"
        className={styles.toggle}
        aria-expanded={abierto}
        aria-controls="panel-notificaciones"
        // Nombre explicito para que todos los lectores lo lean igual: "Notificaciones, 3 sin leer"
        aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
        onClick={() => setAbierto((a) => !a)}
      >
        <Bell size={18} aria-hidden="true" focusable={false} />
        <span>Notificaciones</span>
        {noLeidas > 0 && (
          <span className={styles.contador} aria-hidden="true">
            {noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div
          id="panel-notificaciones"
          className={styles.panel}
          role="region"
          aria-labelledby="titulo-notificaciones"
          onKeyDown={(e) => {
            if (e.key === 'Escape') cerrar();
          }}
        >
          <h3 id="titulo-notificaciones" className={styles.titulo}>Notificaciones</h3>

          {notificaciones.length === 0 ? (
            <p className={styles.vacio}>No tienes notificaciones.</p>
          ) : (
            <ul className={styles.lista}>
              {notificaciones.map((n) => (
                <li key={n.id} className={`${styles.item} ${n.leida ? '' : styles.noLeida}`}>
                  {n.enlace?.startsWith('/') ? (
                    <Link href={n.enlace} className={styles.enlace} onClick={() => !n.leida && marcarLeida(n.id)}>
                      {!n.leida && <span className={styles.srOnly}>No leída: </span>}
                      {n.mensaje}
                    </Link>
                  ) : (
                    <span>
                      {!n.leida && <span className={styles.srOnly}>No leída: </span>}
                      {n.mensaje}
                    </span>
                  )}
                  <time className={styles.fecha} dateTime={n.createdAt}>
                    {new Date(n.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                  </time>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.acciones}>
            {noLeidas > 0 && (
              <button type="button" className={styles.btnSecundario} onClick={handleMarcarTodas}>
                Marcar todas como leídas
              </button>
            )}
            <button ref={cerrarRef} type="button" className={styles.btnSecundario} onClick={cerrar}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
