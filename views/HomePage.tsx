'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ✅ para redirigir
import styles from '../styles/HomePage.module.css';

export default function HomePage() {
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [mostrarCreditos, setMostrarCreditos] = useState(false);
  const router = useRouter(); // ✅ Hook de navegación

  // refs para manejo de foco accesible (tipados correctamente para TS)
  const helpHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const creditsHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  // funciones de toggle con manejo de aria-expanded y foco
  const toggleAyuda = () => {
    const now = !mostrarAyuda;
    setMostrarAyuda(now);
    // dar anuncio al lector de pantalla (comprobación segura del ref)
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = now
        ? 'Se ha abierto la ayuda de accesibilidad'
        : 'Se ha ocultado la ayuda de accesibilidad';
    }
  };

  const toggleCreditos = () => {
    const now = !mostrarCreditos;
    setMostrarCreditos(now);
    if (liveRegionRef.current) {
      liveRegionRef.current.textContent = now
        ? 'Se han mostrado los créditos'
        : 'Se han ocultado los créditos';
    }
  };

  // cuando se abre un panel, mover el foco al encabezado del panel
  useEffect(() => {
    if (mostrarAyuda) {
      helpHeadingRef.current?.focus();
    }
  }, [mostrarAyuda]);

  useEffect(() => {
    if (mostrarCreditos) {
      creditsHeadingRef.current?.focus();
    }
  }, [mostrarCreditos]);

  const handleIniciarSesion = () => {
    router.push('/login'); // ✅ redirige correctamente al LoginPage
  };

  return (
    <>
      {/* Skip link para saltar al contenido. Debe estar visible con teclado en CSS. */}
      <a className={styles.skipLink} href="#mainContent">Saltar al contenido</a>

      {/* Región de anuncio para lectores de pantalla (aria-live) */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly} // srOnly: visibilidad solo para lectores; definir en CSS
      />

      <main id="mainContent" className={styles.main} role="main">
        <div className={styles.container}>
          <h1 className={styles.title}>
            Bienvenido al Sistema de Gestión de Syllabus - Inkluye
          </h1>

          <p className={styles.description}>
            Este sistema está diseñado para facilitar la gestión de syllabus en instituciones educativas,
            cumpliendo con la normativa <strong>WCAG 2.1 AAA</strong> para garantizar accesibilidad para todas las personas,
            incluyendo usuarios con discapacidades visuales.
          </p>

          {/* Navegación principal con label y orden de tabulación lógico.
              Los botones tienen type="button" y atributos aria-expanded/controls. */}
          <nav className={styles.nav} role="navigation" aria-label="Acciones principales">
            <button
              type="button"
              onClick={handleIniciarSesion}
              className={styles.primaryButton}
            >
              Iniciar sesión
            </button>

            <button
              type="button"
              onClick={toggleAyuda}
              className={styles.outlineButtonPrimary}
              aria-expanded={mostrarAyuda}
              aria-controls="helpSection"
            >
              {mostrarAyuda ? 'Ocultar ayuda de accesibilidad' : 'Ayuda de accesibilidad'}
            </button>

            <button
              type="button"
              onClick={toggleCreditos}
              className={styles.outlineButtonSecondary}
              aria-expanded={mostrarCreditos}
              aria-controls="creditSection"
            >
              {mostrarCreditos ? 'Ocultar créditos' : 'Créditos'}
            </button>
          </nav>

          {/* Sección de ayuda: usa role="region", aria-labelledby y control de visibilidad.
              El heading recibe tabindex -1 y focus cuando se abre para que lectores lo localicen. */}
          <section
            id="helpSection"
            className={`${styles.helpSection} ${mostrarAyuda ? styles.visible : styles.hidden}`}
            role="region"
            aria-labelledby="helpHeading"
            aria-hidden={!mostrarAyuda}
          >
            <h2
              id="helpHeading"
              ref={helpHeadingRef}
              tabIndex={-1}
              className={styles.sectionHeading}
            >
              Instrucciones de accesibilidad
            </h2>

            <ul>
              <li>Usa <strong>Tab ↹</strong> para navegar entre elementos interactivos.</li>
              <li>Presiona <strong>Enter ⏎</strong> para activar botones o enlaces.</li>
              <li>Usa <strong>Ctrl + +</strong> (o las funciones del navegador) para aumentar el tamaño del texto.</li>
              <li>Compatible con lectores de pantalla: NVDA, JAWS o VoiceOver.</li>
            </ul>
          </section>

          {/* Sección de créditos con prácticas similares */}
          <section
            id="creditSection"
            className={`${styles.creditSection} ${mostrarCreditos ? styles.visible : styles.hidden}`}
            role="region"
            aria-labelledby="creditHeading"
            aria-hidden={!mostrarCreditos}
          >
            <h2
              id="creditHeading"
              ref={creditsHeadingRef}
              tabIndex={-1}
              className={styles.sectionHeading}
            >
              Créditos del sistema
            </h2>

            <ul>
              <li><strong>Condor Marin, Jesus Ernesto</strong></li>
              <li><strong>Quiroz Ardiles, Sergio Daniel</strong></li>
            </ul>
            <p>Desarrollado con enfoque inclusivo y accesible.</p>
          </section>
        </div>
      </main>
    </>
  );
}
