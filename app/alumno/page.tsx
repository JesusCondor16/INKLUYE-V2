'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './AlumnoPage.module.css';
import { Sigla } from '@/components/Glosario/Glosario';

export default function BienvenidaEstudiantePage() {
  return (
    <div className={styles.wrapper}>
      
      {/* El Sidebar ya es un <aside> con su propio <nav>: sin envoltorios extra */}
      <Sidebar />

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
            Use el menú de la izquierda para ir a sus herramientas.
            Esta página sigue las pautas de accesibilidad <strong><Sigla id="wcag" /> 2.1</strong>,
            nivel <strong><Sigla id="aaa" /></strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
