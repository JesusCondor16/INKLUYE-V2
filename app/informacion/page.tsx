'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/Informacion.module.css';

/**
 * Página de Información — estructura y ARIA pensada para WCAG 2.1 AAA
 * - Skip link al inicio para saltar el nav/Sidebar
 * - Sidebar envuelto en <aside> con aria-label
 * - main con id="maincontent" y aria-labelledby
 * - encabezados semánticos h1 -> h2 correctos
 * - emojis marcados como aria-hidden y texto accesible adicional
 * - clases .srOnly usadas para contenido solo lector de pantalla
 */
export default function InformacionPage() {
  return (
    <>
      {/* Skip link: primer elemento focoable para usuarios teclado / lectores */}
      <a href="#maincontent" className={styles.skipLink}>
        Saltar al contenido
      </a>

      <div className={styles.container}>
        {/* Sidebar accesible como aside */}
        <aside className={styles.sidebarWrapper} aria-label="Navegación lateral">
          <Sidebar />
        </aside>

        <main
          id="maincontent"
          className={styles.main}
          role="main"
          aria-labelledby="page-title"
        >
          <h1 id="page-title" className={styles.title}>
            {/* Emoji decorativo marcado aria-hidden + texto adicional para SR */}
            <span aria-hidden="true">🌐</span>
            <span className={styles.srOnly}> </span>
            Información del Sistema Inkluye
          </h1>

          <section aria-labelledby="sobre-inkluye" className={styles.section}>
            <h2 id="sobre-inkluye" className={styles.subtitle}>
              ¿Qué es Inkluye?
            </h2>

            <p>
              <strong>Inkluye</strong> es un sistema de gestión de syllabus desarrollado
              para apoyar a las instituciones educativas en la organización, creación y
              seguimiento de los syllabus de cada curso, de forma centralizada e
              inclusiva.
            </p>

            <p>
              Facilita el trabajo de <strong>directores</strong>, <strong>coordinadores</strong>,{' '}
              <strong>docentes</strong> y <strong>estudiantes</strong> mediante herramientas
              accesibles y optimizadas para la gestión académica.
            </p>
          </section>

          <section aria-labelledby="accesibilidad" className={styles.section}>
            <h2 id="accesibilidad" className={styles.subtitle}>
              Compromiso con la accesibilidad
            </h2>

            <p>
              Inkluye sigue los lineamientos de <strong>WCAG 2.1 AAA</strong>, garantizando
              que las personas puedan utilizar la plataforma sin barreras, incluyendo:
            </p>

            <ul className={styles.list}>
              <li>Contraste alto y tipografía legible para personas con visión reducida.</li>
              <li>Compatibilidad con lectores de pantalla y navegación mediante teclado.</li>
              <li>Estructura semántica clara y jerarquía de encabezados.</li>
              <li>Enlaces y botones con foco visible y destacado.</li>
            </ul>
          </section>

          <section aria-labelledby="objetivo" className={styles.section}>
            <h2 id="objetivo" className={styles.subtitle}>
              Objetivo del sistema
            </h2>

            <p>
              Facilitar la creación, revisión y gestión de syllabus promoviendo la
              mejora continua, la inclusión y la transparencia en los procesos educativos.
            </p>
          </section>

          <footer className={styles.footer}>
            <p>© {new Date().getFullYear()} Inkluye – Sistema de Gestión de Syllabus Accesible</p>
          </footer>
        </main>
      </div>
    </>
  );
}
