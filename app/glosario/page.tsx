'use client';

import { BookA } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import styles from '@/styles/Informacion.module.css';
import { TERMINOS, SIGLAS } from '@/lib/glosario';

// Glosario de terminos y siglas del sistema (WCAG 2.1 - 3.1.3 y 3.1.4, AAA; tecnica G62)
export default function GlosarioPage() {
  return (
    <div className={styles.container}>
      <div className={styles.sidebarWrapper}>
        <Sidebar />
      </div>

      <main id="main-content" tabIndex={-1} className={styles.main} aria-labelledby="page-title">
        <h1 id="page-title" className={styles.title}>
          <BookA size={28} aria-hidden="true" focusable={false} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
          Glosario
        </h1>

        <p>Aquí se explican las palabras y siglas que usa el sistema.</p>

        <section aria-labelledby="glosario-terminos" className={styles.section}>
          <h2 id="glosario-terminos" className={styles.subtitle}>Palabras del syllabus</h2>
          <dl>
            {TERMINOS.map((e) => (
              <div key={e.id} id={`termino-${e.id}`}>
                <dt><dfn>{e.termino}</dfn></dt>
                <dd>{e.definicion}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="glosario-siglas" className={styles.section}>
          <h2 id="glosario-siglas" className={styles.subtitle}>Siglas</h2>
          <dl>
            {SIGLAS.map((e) => (
              <div key={e.id} id={`sigla-${e.id}`}>
                {/* "中文" se marca en chino para que el lector lo pronuncie bien (WCAG 3.1.2) */}
                <dt><abbr lang={e.id === 'zh' ? 'zh' : undefined}>{e.termino}</abbr></dt>
                <dd>{e.definicion}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </div>
  );
}
