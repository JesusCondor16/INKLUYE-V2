'use client';

import { useState } from 'react';
import base from '../ModalsSyllabus/ModalBase.module.css';
import styles from './AvisoSesion.module.css';
import { useAvisoSesionController } from './AvisoSesion.controller';
import { minutosRestantes } from './AvisoSesion.model';
import { useDialogoAccesible } from '@/hooks/useDialogoAccesible';

/**
 * WCAG 2.1 - 2.2.6 Tiempos de espera (AAA): avisa 5 minutos antes de que venza la sesion
 * y permite extenderla. WCAG 2.1 - 2.2.5 Reautenticacion (AAA): si ya vencio, se vuelve a
 * ingresar la contraseña aqui mismo, sin recargar, y no se pierde lo que estaba escrito.
 * Se monta en el Sidebar, que esta en todas las paginas con sesion.
 */
export default function AvisoSesion() {
  const c = useAvisoSesionController();

  if (c.fase === 'aviso' && c.expiraEn !== null) {
    return (
      <DialogoAviso
        minutos={minutosRestantes(c.expiraEn, c.ahora)}
        procesando={c.procesando}
        error={c.error}
        onSeguir={c.renovar}
        onCerrarSesion={c.cerrarSesion}
        onDescartar={c.descartarAviso}
      />
    );
  }

  if (c.fase === 'vencida') {
    return (
      <DialogoVencida
        email={c.email}
        procesando={c.procesando}
        error={c.error}
        onReautenticar={c.reautenticar}
      />
    );
  }

  return null;
}

// Escape se detiene aqui: si debajo hay otro modal abierto (p. ej. bibliografia),
// su propio Escape lo cerraria y se perderia lo escrito.
// En Next.js React escucha los eventos en el mismo `document` que useDialogoAccesible,
// por eso no basta stopPropagation: stopImmediatePropagation corta a los demas oyentes
// de document (React se registra primero, al hidratar la pagina).
function detenerEscape(e: React.KeyboardEvent, accion?: () => void) {
  if (e.key === 'Escape') {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    accion?.();
  }
}

function DialogoAviso(props: {
  minutos: number;
  procesando: boolean;
  error: string;
  onSeguir: () => void;
  onCerrarSesion: () => void;
  onDescartar: () => void;
}) {
  // El Escape lo maneja detenerEscape (descarta el aviso); el hook pone el foco, atrapa Tab y lo devuelve
  const ref = useDialogoAccesible<HTMLDivElement>(() => undefined);

  return (
    <div className={styles.overlay}>
      <div
        ref={ref}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-sesion-titulo"
        aria-describedby="aviso-sesion-desc"
        onKeyDown={(e) => detenerEscape(e, props.onDescartar)}
      >
        <header className={base.header}>
          <h2 id="aviso-sesion-titulo" className={base.title}>Su sesión está por vencer</h2>
        </header>

        <div className={base.body}>
          <p id="aviso-sesion-desc">
            Por seguridad, la sesión se cierra una hora después de iniciarla.
            {' '}{props.minutos === 1 ? 'Queda 1 minuto' : `Quedan ${props.minutos} minutos`}.
            {' '}Si continúa conectado, no perderá lo que está haciendo.
          </p>
          {props.error && <p role="alert" className={base.mensajeError}>{props.error}</p>}
        </div>

        <footer className={base.footer}>
          <button
            type="button"
            className={`${base.button} ${base.buttonPrimary}`}
            onClick={props.onSeguir}
            disabled={props.procesando}
            aria-busy={props.procesando}
          >
            {props.procesando ? 'Extendiendo…' : 'Seguir conectado'}
          </button>
          <button type="button" className={`${base.button} ${base.buttonSecondary}`} onClick={props.onCerrarSesion}>
            Cerrar sesión
          </button>
        </footer>
      </div>
    </div>
  );
}

function DialogoVencida(props: {
  email: string;
  procesando: boolean;
  error: string;
  onReautenticar: (password: string) => void;
}) {
  const [password, setPassword] = useState('');
  // No se cierra con Escape: sin sesion la pagina no puede guardar nada. La salida es el enlace al login.
  const ref = useDialogoAccesible<HTMLDivElement>(() => undefined);

  return (
    <div className={styles.overlay}>
      <div
        ref={ref}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="sesion-vencida-titulo"
        aria-describedby="sesion-vencida-desc"
        onKeyDown={(e) => detenerEscape(e)}
      >
        <header className={base.header}>
          <h2 id="sesion-vencida-titulo" className={base.title}>Su sesión venció</h2>
        </header>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            props.onReautenticar(password);
          }}
        >
          <div className={base.body}>
            <p id="sesion-vencida-desc">
              Para no perder lo que estaba haciendo, vuelva a ingresar su contraseña aquí.
              La página no se recargará.
            </p>

            {props.error && (
              <p id="sesion-vencida-error" role="alert" className={base.mensajeError}>{props.error}</p>
            )}

            {/* El correo no se puede cambiar (es la misma sesion); como texto, el foco va directo a la contraseña */}
            <p>Usuario: <strong>{props.email}</strong></p>

            <div className={styles.campo}>
              <label htmlFor="sesion-vencida-clave" className={styles.etiqueta}>Contraseña *</label>
              <input
                id="sesion-vencida-clave"
                type="password"
                className={base.control}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-invalid={!!props.error}
                aria-describedby={props.error ? 'sesion-vencida-error' : undefined}
              />
            </div>
          </div>

          <footer className={base.footer}>
            <a href="/login" className={`${base.button} ${base.buttonSecondary}`}>
              Ir a iniciar sesión (se pierden los cambios)
            </a>
            <button
              type="submit"
              className={`${base.button} ${base.buttonPrimary}`}
              disabled={props.procesando}
              aria-busy={props.procesando}
            >
              {props.procesando ? 'Ingresando…' : 'Volver a ingresar'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
