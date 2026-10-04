'use client';

import { Accessibility, FileText } from 'lucide-react';
import styles from './IdiomasSyllabus.module.css';

export type IdiomaSyllabus = 'es' | 'en' | 'zh';

export interface EnlaceIdioma {
  lang: IdiomaSyllabus;
  url: string;
  generadoEn?: string;
}

// Syllabus inclusivo (WCAG 2.1 AAA): pagina accesible y PDF etiquetado
export interface EnlaceInclusivo {
  formato: 'html' | 'pdf';
  url: string;
  generadoEn?: string;
}

const INCLUSIVO: Record<EnlaceInclusivo['formato'], { visible: string; descripcion: string }> = {
  html: { visible: 'Página accesible', descripcion: 'página web accesible' },
  pdf: { visible: 'PDF accesible', descripcion: 'PDF etiquetado para lectores de pantalla' },
};

interface Props {
  idiomas: EnlaceIdioma[];
  inclusivo?: EnlaceInclusivo[];
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

export default function IdiomasSyllabus({ idiomas, inclusivo = [], nombreCurso, mostrarFechas = false }: Props) {
  if (idiomas.length === 0 && inclusivo.length === 0) return null;

  const masReciente = Math.max(
    ...[...idiomas, ...inclusivo].map((i) => (i.generadoEn ? Date.parse(i.generadoEn) : 0)),
  );
  const fecha = (generadoEn?: string) =>
    mostrarFechas && generadoEn ? (
      <span className={styles.fecha}>
        Generado el{' '}
        <time dateTime={generadoEn}>
          {new Date(generadoEn).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
        </time>
      </span>
    ) : null;
  const avisoViejo = (generadoEn?: string) =>
    mostrarFechas && !!generadoEn && masReciente - Date.parse(generadoEn) > MARGEN_DESACTUALIZADO_MS ? (
      <span className={styles.aviso}>
        Anterior a la versión más reciente: vuelve a generarlo si cambiaste el contenido.
      </span>
    ) : null;

  return (
    <ul className={styles.lista} aria-label={`Syllabus de ${nombreCurso} por idioma y versión accesible`}>
      {idiomas.map(({ lang, url, generadoEn }) => {
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

            {fecha(generadoEn)}
            {avisoViejo(generadoEn)}
          </li>
        );
      })}

      {inclusivo.map(({ formato, url, generadoEn }) => (
        <li key={formato} className={styles.item}>
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.enlace}>
            <Accessibility size={18} aria-hidden="true" focusable={false} />
            {INCLUSIVO[formato].visible}
            <span className={styles.srOnly}>
              {` — syllabus inclusivo de ${nombreCurso}, ${INCLUSIVO[formato].descripcion} (abre en otra pestaña)`}
            </span>
          </a>
          {fecha(generadoEn)}
          {avisoViejo(generadoEn)}
        </li>
      ))}
    </ul>
  );
}
