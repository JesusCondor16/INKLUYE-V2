'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './AlumnoPage.module.css';

export default function BienvenidaEstudiantePage() {
  return (
    <div className={styles.wrapper}>
      {/* Skip link para navegación por teclado */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      {/* Sidebar dentro de landmark nav */}
      <nav aria-label="Navegación principal">
        <Sidebar />
      </nav>

      {/* Contenido principal accesible */}
      <main
        id="main-content"
        className={styles.main}
        role="main"
        aria-labelledby="page-title"
        tabIndex={-1}
      >
        <h1 id="page-title" className={styles.title}>
          ¡Bienvenido, Estudiante!
        </h1>

        <p className={styles.subtitle}>
          Aquí podrás buscar syllabus, revisar cursos y acceder a información académica importante.
        </p>

        <section
          className={styles.infoPanel}
          role="region"
          aria-labelledby="panel-estudiante"
        >
          <h2 id="panel-estudiante" className={styles.title} style={{ fontSize: '1rem' }}>
            Panel del Estudiante
          </h2>

          <p className={styles.lead} style={{ margin: 0 }}>
            Usa el menú lateral para navegar por tus herramientas. Este panel cumple con la normativa 
            <strong> WCAG 2.1 AAA</strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
