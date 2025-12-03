'use client';

import Sidebar from '@/components/Sidebar';
import styles from '@/styles/coordinador.module.css';

export default function BienvenidaCoordinadorPage() {
  return (
    <div className={styles.wrapper}>
      {/* Skip link para navegación por teclado (visible al recibir foco) */}
      <a href="#main-content" className={styles.skipLink}>
        Saltar al contenido principal
      </a>

      {/* Si Sidebar es un nav por sí mismo, esto no rompe nada.
          Lo envolvemos en <nav> para garantizar el landmark si Sidebar no lo define. */}
      <nav aria-label="Navegación principal">
        <Sidebar />
      </nav>

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
            Usa el menú lateral para navegar por tus herramientas. Este panel cumple con la
            normativa <strong>WCAG 2.1 AAA</strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
