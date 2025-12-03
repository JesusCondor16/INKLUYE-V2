// app/(auth)/login/LoginForm.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authController } from '@/controllers/authController';
import { AuthError } from '@/services/authService';
import styles from './LoginPage.module.css';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errorRef = useRef<HTMLDivElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);
  const helpHeadingRef = useRef<HTMLHeadingElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const result = await authController.login(email, password);

      if (result.to) {
        router.push(result.to);
        return;
      }

      setErrorMsg('Autenticación exitosa pero no se proporcionó ruta.');
    } catch (err: any) {
      if (err instanceof AuthError) {
        setErrorMsg(err.publicMessage);
      } else {
        setErrorMsg('Error inesperado. Intenta de nuevo.');
      }

      setTimeout(() => errorRef.current?.focus(), 0);

      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = err?.message ?? '';
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        ref={liveRegionRef}
        className={styles.srOnly}
        aria-live="polite"
        aria-atomic="true"
      />

      <form
        onSubmit={onSubmit}
        className={styles.form}
        aria-labelledby="loginTitle"
        noValidate
      >
        <h2 id="loginTitle" className={styles.hiddenTitle}>
          Iniciar sesión
        </h2>

        {errorMsg && (
          <div
            id="errorMessage"
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className={styles.error}
          >
            {errorMsg}
          </div>
        )}

        <label htmlFor="email" className={styles.label}>
          Correo electrónico
        </label>
        <input
          id="email"
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
        />

        <label htmlFor="password" className={styles.label}>
          Contraseña
        </label>
        <input
          id="password"
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          aria-required="true"
        />

        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={submitting}
          aria-disabled={submitting}
        >
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </button>

        <button
          type="button"
          className={styles.btnSecondary}
          aria-controls="helpRegion"
          aria-expanded={mostrarAyuda}
          onClick={() => setMostrarAyuda((v) => !v)}
        >
          {mostrarAyuda ? 'Ocultar ayuda' : 'Ayuda de accesibilidad'}
        </button>

        {mostrarAyuda && (
          <section
            id="helpRegion"
            role="region"
            aria-labelledby="helpHeading"
            className={styles.help}
          >
            <h3 id="helpHeading" tabIndex={-1} ref={helpHeadingRef}>
              Instrucciones de accesibilidad
            </h3>
            <ul>
              <li>Navega con Tab.</li>
              <li>Presiona Enter para enviar.</li>
              <li>Total compatibilidad con lectores de pantalla.</li>
            </ul>
          </section>
        )}
      </form>
    </>
  );
}
