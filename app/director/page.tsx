'use client';

import Link from 'next/link';
import { useNombreUsuario } from '@/hooks/useNombreUsuario';
import styles from '@/styles/DirectorHome.module.css';

export default function DirectorHomePage() {
  const { nombre, status, error } = useNombreUsuario();

  return (
    <main role="main" aria-label="Panel principal del director" className={styles.main}>
      <section className={styles.section}>
        <h1 className={styles.title}>
          {status === 'loading' ? 'Cargando...' : `Bienvenido, ${nombre}`}
        </h1>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className={styles.error}
          >
            {error}
          </div>
        )}

        <p className={styles.text}>
          Desde este panel podrá gestionar docentes, cursos y syllabus de manera eficiente.
        </p>

        <div className={styles.buttons}>
          <Link
            href="/director/docentes"
            className={`btn btn-primary ${styles.btnPrimary}`}
            tabIndex={0}
          >
            Gestión de Docentes
          </Link>

          <Link
            href="/director/cursos"
            className={`btn btn-outline-primary ${styles.btnOutline}`}
            tabIndex={0}
          >
            Gestión de Cursos
          </Link>
        </div>
      </section>
    </main>
  );
}
