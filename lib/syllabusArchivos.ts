// lib/syllabusArchivos.ts
// Ubicacion y nombres de los PDF de syllabus. Se guardan fuera de public/
// para que solo se puedan descargar a traves de la ruta que valida permisos.
import fs from 'fs';
import path from 'path';

export const IDIOMAS_SYLLABUS = ['es', 'en', 'zh'] as const;
export type IdiomaSyllabus = (typeof IDIOMAS_SYLLABUS)[number];

export const CARPETA_SYLLABUS = path.join(process.cwd(), 'storage', 'syllabus');

export function esIdiomaSyllabus(valor: string): valor is IdiomaSyllabus {
  return (IDIOMAS_SYLLABUS as readonly string[]).includes(valor);
}

// Solo acepta nombres con el formato exacto "<courseId>-<idioma>.pdf"
export function idiomaDesdeNombreArchivo(courseId: number, filename: string): IdiomaSyllabus | null {
  const match = new RegExp(`^${courseId}-([a-z]{2})\\.pdf$`).exec(filename);
  if (!match || !esIdiomaSyllabus(match[1])) return null;
  return match[1];
}

export function rutaArchivoSyllabus(courseId: number, lang: IdiomaSyllabus): string {
  return path.join(CARPETA_SYLLABUS, `${courseId}-${lang}.pdf`);
}

export function urlSyllabus(courseId: number, lang: IdiomaSyllabus): string {
  return `/api/cursos/${courseId}/syllabus-pdf?lang=${lang}`;
}

export interface ArchivoIdioma {
  lang: IdiomaSyllabus;
  url: string;
  generadoEn: string; // ISO; fecha de ultima modificacion del PDF en disco
}

// Idiomas cuyo PDF existe en disco (cada idioma se genera por separado)
export function idiomasDisponibles(courseId: number): ArchivoIdioma[] {
  return IDIOMAS_SYLLABUS.flatMap((lang) => {
    try {
      const { mtime } = fs.statSync(rutaArchivoSyllabus(courseId, lang));
      return [{ lang, url: urlSyllabus(courseId, lang), generadoEn: mtime.toISOString() }];
    } catch {
      return [];
    }
  });
}

// ---------------------------------------------------------------------------
// Syllabus inclusivo (WCAG 2.1 AAA): una pagina HTML accesible y su PDF etiquetado (PDF/UA).
// Se guardan junto a los otros PDF: "<courseId>-inclusivo.html" y "<courseId>-inclusivo.pdf".
export const FORMATOS_INCLUSIVO = ['html', 'pdf'] as const;
export type FormatoInclusivo = (typeof FORMATOS_INCLUSIVO)[number];

export function esFormatoInclusivo(valor: string): valor is FormatoInclusivo {
  return (FORMATOS_INCLUSIVO as readonly string[]).includes(valor);
}

export function rutaSyllabusInclusivo(courseId: number, formato: FormatoInclusivo): string {
  return path.join(CARPETA_SYLLABUS, `${courseId}-inclusivo.${formato}`);
}

export function urlSyllabusInclusivo(courseId: number, formato: FormatoInclusivo): string {
  return `/api/cursos/${courseId}/syllabus-inclusivo?formato=${formato}`;
}

export interface ArchivoInclusivo {
  formato: FormatoInclusivo;
  url: string;
  generadoEn: string;
}

// Formatos del syllabus inclusivo que ya existen en disco
export function inclusivoDisponible(courseId: number): ArchivoInclusivo[] {
  return FORMATOS_INCLUSIVO.flatMap((formato) => {
    try {
      const { mtime } = fs.statSync(rutaSyllabusInclusivo(courseId, formato));
      return [{ formato, url: urlSyllabusInclusivo(courseId, formato), generadoEn: mtime.toISOString() }];
    } catch {
      return [];
    }
  });
}