// lib/syllabusArchivos.ts
// Ubicacion y nombres de los PDF de syllabus. Se guardan fuera de public/
// para que solo se puedan descargar a traves de la ruta que valida permisos.
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
