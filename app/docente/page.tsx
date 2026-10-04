'use client';

import React from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './DocentePage.module.css';
import { Sigla } from '@/components/Glosario/Glosario';

export default function BienvenidaDocentePage() {
  return (
    <div className={styles.wrapper}>
      
      {/* El Sidebar ya es un <aside> con su propio <nav>: sin envoltorios extra */}
      <Sidebar />

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
            Use el menú de la izquierda para ir a sus herramientas.
            Esta página sigue las pautas de accesibilidad <strong><Sigla id="wcag" /> 2.1</strong>,
            nivel <strong><Sigla id="aaa" /></strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
