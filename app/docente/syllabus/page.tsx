'use client';

import Sidebar from '@/components/Sidebar';
import styles from '@/styles/buscar-syllabus.module.css';
import RevisionSyllabus from '@/components/RevisionSyllabus/RevisionSyllabus';

// Pagina compartida por docentes y coordinadores que dictan cursos
export default function SyllabusPorRevisarPage() {
  return (
    <div className={styles.wrapper}>
      <Sidebar />

      <main id="main-content" className={styles.main} role="main" aria-labelledby="page-title">
        <h1 id="page-title" className={styles.title} tabIndex={-1}>
          Sílabos por revisar
        </h1>
        <p>
          Revisa el syllabus que te envió el coordinador. Puedes publicarlo para los estudiantes
          o devolverlo con observaciones.
        </p>

        <RevisionSyllabus />
      </main>
    </div>
  );
}
