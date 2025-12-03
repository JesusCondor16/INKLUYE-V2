'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './DocentePage.module.css';

export default function BienvenidaDocentePage() {
  return (
    <div className={styles.wrapper}>
      {/* Skip link para saltar al contenido principal */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      <nav aria-label="Navegación principal">
        <Sidebar />
      </nav>

      <main
        id="main-content"
        className={styles.main}
        role="main"
        aria-labelledby="page-title"
        tabIndex={-1}
      >
        <h1 id="page-title" className={styles.title}>
          ¡Bienvenido, Docente!
        </h1>

        <p className={styles.subtitle}>
          Aquí podrás ver información clave sobre tus cursos y tareas académicas.
        </p>

        <section
          className={styles.infoPanel}
          role="region"
          aria-labelledby="panel-docente"
        >
          <h2 id="panel-docente" className={styles.title} style={{ fontSize: '1rem' }}>
            Panel del Docente
          </h2>

          <p className={styles.lead} style={{ margin: 0 }}>
            Usa el menú lateral para navegar por tus herramientas. Este panel cumple con la normativa <strong>WCAG 2.1 AAA</strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
