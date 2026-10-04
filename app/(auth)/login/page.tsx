'use client';

import { useEffect, useState } from 'react';
import styles from './LoginPage.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [sesionExpirada, setSesionExpirada] = useState(false);

  // middleware.ts redirige aqui con ?sesion=expirada cuando el token vencio
  useEffect(() => {
    setSesionExpirada(new URLSearchParams(window.location.search).get('sesion') === 'expirada');
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setEnviando(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.message || 'Error al iniciar sesión');
        return;
      }

      // El servidor guardo el token en una cookie httpOnly (JavaScript no puede leerla)
      // y nos dice a donde ir segun el rol. Antes el token se guardaba en localStorage
      // y se decodificaba aqui con jwt-decode.
      localStorage.removeItem('token'); // limpia el token que dejaban versiones anteriores

      if (!data.redirectTo) {
        setErrorMsg('Rol no reconocido. Contacte al administrador.');
        return;
      }

      window.location.href = data.redirectTo;
    } catch (error) {
      console.error(error);
      setErrorMsg('Error inesperado al iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar Sesión</h1>

        <form onSubmit={handleSubmit}>
          <p className={styles.description}>
            Ingresa tu correo y contraseña para acceder al sistema. Todos los campos son obligatorios.
          </p>

          {/* Aviso (no error): role="status" lo anuncia sin interrumpir (4.1.3) */}
          {sesionExpirada && !errorMsg && (
            <p role="status" className={styles.aviso}>
              Su sesión expiró. Inicie sesión nuevamente para continuar.
            </p>
          )}

          {/* role="alert": el lector de pantalla anuncia el error apenas aparece (3.3.1 / 4.1.3) */}
          {errorMsg && (
            <div id="login-error" role="alert" className={styles.error}>
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="email" className={styles.label}>Correo electrónico *</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              aria-invalid={!!errorMsg}
              aria-describedby={errorMsg ? 'login-error' : undefined}
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label htmlFor="password" className={styles.label}>Contraseña *</label>
            <input
              id="password"
              name="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              aria-invalid={!!errorMsg}
              aria-describedby={errorMsg ? 'login-error' : undefined}
            />
          </div>

          <button type="submit" className={styles.button} disabled={enviando} aria-busy={enviando}>
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMostrarAyuda(!mostrarAyuda)}
          className={styles.helpButton}
          aria-expanded={mostrarAyuda}
          aria-controls="ayuda-accesibilidad"
        >
          {mostrarAyuda ? 'Ocultar ayuda' : 'Ayuda de accesibilidad'}
        </button>

        {mostrarAyuda && (
          <section id="ayuda-accesibilidad" className={styles.helpSection} aria-labelledby="ayuda-titulo">
            <h2 id="ayuda-titulo">Instrucciones de navegación accesible</h2>
            <ul>
              <li>Presiona <strong>Tab</strong> para moverte entre campos y botones.</li>
              <li>Usa <strong>Shift + Tab</strong> para retroceder.</li>
              <li>Presiona <strong>Enter</strong> en el botón para enviar.</li>
              <li>Compatible con lectores de pantalla y zoom del navegador.</li>
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
