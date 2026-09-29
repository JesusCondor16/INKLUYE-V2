'use client';

import { FileText } from 'lucide-react';
import styles from './IdiomasSyllabus.module.css';

export type IdiomaSyllabus = 'es' | 'en' | 'zh';

export interface EnlaceIdioma {
  lang: IdiomaSyllabus;
  url: string;
  generadoEn?: string;
}

interface Props {
  idiomas: EnlaceIdioma[];
  nombreCurso: string;
  // Panel del coordinador: muestra la fecha de cada PDF y avisa si alguno quedo desactualizado
  mostrarFechas?: boolean;
}

// Etiqueta visible en el propio idioma + nombre del idioma en espanol para el lector de pantalla
const IDIOMA: Record<IdiomaSyllabus, { visible: string; nombre: string }> = {
  es: { visible: 'ES', nombre: 'español' },
  en: { visible: 'EN', nombre: 'inglés' },
  zh: { visible: '中文', nombre: 'chino' },
};

// Un PDF generado mas de 5 minutos antes que el mas reciente probablemente no refleja el ultimo cambio
const MARGEN_DESACTUALIZADO_MS = 5 * 60 * 1000;

export default function IdiomasSyllabus({ idiomas, nombreCurso, mostrarFechas = false }: Props) {
  if (idiomas.length === 0) return null;

  const masReciente = Math.max(...idiomas.map((i) => (i.generadoEn ? Date.parse(i.generadoEn) : 0)));

  return (
    <ul className={styles.lista} aria-label={`Syllabus de ${nombreCurso} por idioma`}>
      {idiomas.map(({ lang, url, generadoEn }) => {
        const desactualizado =
          mostrarFechas && !!generadoEn && masReciente - Date.parse(generadoEn) > MARGEN_DESACTUALIZADO_MS;

        return (
          <li key={lang} className={styles.item}>
            {/* lang + hreflang: el lector pronuncia "中文" en chino y anuncia el idioma del PDF (WCAG 3.1.2) */}
            <a href={url} target="_blank" rel="noopener noreferrer" hrefLang={lang} className={styles.enlace}>
              <FileText size={18} aria-hidden="true" focusable={false} />
              <span lang={lang}>{IDIOMA[lang].visible}</span>
              <span className={styles.srOnly}>
                {` — syllabus de ${nombreCurso} en ${IDIOMA[lang].nombre} (PDF, abre en otra pestaña)`}
              </span>
            </a>

            {mostrarFechas && generadoEn && (
              <span className={styles.fecha}>
                Generado el{' '}
                <time dateTime={generadoEn}>
                  {new Date(generadoEn).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </span>
            )}

            {desactualizado && (
              <span className={styles.aviso}>
                Anterior a la versión más reciente: vuelve a generarlo si cambiaste el contenido.
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
