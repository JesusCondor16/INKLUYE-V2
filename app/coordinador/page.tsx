'use client';

import Sidebar from '@/components/Sidebar';
import styles from '@/styles/coordinador.module.css';
import { Sigla } from '@/components/Glosario/Glosario';

export default function BienvenidaCoordinadorPage() {
  return (
    <div className={styles.wrapper}>

      {/* El Sidebar ya es un <aside> con su propio <nav>: sin envoltorios extra */}
      <Sidebar />

      {/* Main: id para skip-link y tabIndex para permitir que el ancla enfoque aquí */}
      <main
        id="main-content"
        className={styles.main}
        role="main"
        aria-labelledby="page-title"
        tabIndex={-1}
      >
        <h1 id="page-title" className={styles.title}>
          ¡Bienvenido, Coordinador!
        </h1>

        <p className={styles.lead}>
          Aquí podrás gestionar tus cursos, docentes y toda la información académica.
        </p>

        {/* Panel informativo — uso .statusBox (definido en tu CSS) para buen contraste */}
        <section
          className={styles.statusBox}
          role="region"
          aria-labelledby="panel-coordinador"
        >
          <h2 id="panel-coordinador" className={styles.title} style={{ fontSize: '1rem' }}>
            Panel del Coordinador
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
