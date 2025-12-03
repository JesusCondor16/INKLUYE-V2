'use client';

import { useState } from 'react';
import jwtDecode from 'jwt-decode';
import styles from './LoginPage.module.css';

type JwtPayload = {
  role?: string;
  name?: string;
  email?: string;
  // agrega otros campos que tengas en tu token
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarAyuda, setMostrarAyuda] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');

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

      const { token } = data;

      if (!token) {
        setErrorMsg('No se recibió token de autenticación.');
        return;
      }

      // Guardamos token en localStorage
      localStorage.setItem('token', token);

      // Decodificamos para obtener rol y nombre
      const decoded = jwtDecode<JwtPayload>(token);
      const userRole = decoded.role?.toLowerCase();

      // Redirigimos según rol
      switch (userRole) {
        case 'director':
          window.location.href = '/director';
          break;
        case 'coordinador':
          window.location.href = '/coordinador';
          break;
        case 'docente':
          window.location.href = '/docente';
          break;
        case 'estudiante':
        case 'alumno':
          window.location.href = '/alumno';
          break;
        default:
          setErrorMsg(`Rol no reconocido: ${decoded.role}`);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error inesperado al iniciar sesión');
    }
  }

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Iniciar Sesión</h1>

        <form onSubmit={handleSubmit}>
          <p className={styles.description}>
            Ingresa tu correo y contraseña para acceder al sistema. Todos los campos son obligatorios.
          </p>

          {errorMsg && <div className={styles.error}>{errorMsg}</div>}

          <div>
            <label htmlFor="email" className={styles.label}>Correo electrónico *</label>
            <input
              id="email"
              name="email"
              type="email"
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
              required
            />
          </div>

          <button type="submit" className={styles.button}>
            Iniciar sesión
          </button>
        </form>

        <button
          onClick={() => setMostrarAyuda(!mostrarAyuda)}
          className={styles.helpButton}
        >
          {mostrarAyuda ? 'Ocultar ayuda' : 'Ayuda de accesibilidad'}
        </button>

        {mostrarAyuda && (
          <section className={styles.helpSection}>
            <h2>Instrucciones de navegación accesible</h2>
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
