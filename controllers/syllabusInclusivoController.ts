// controllers/syllabusInclusivoController.ts
// "Syllabus inclusivo" (WCAG 2.1 AAA): genera la pagina accesible y su PDF etiquetado,
// y los entrega solo a quien tiene permiso. La ruta solo traduce a HTTP.
import fs from 'fs/promises';
import type { CustomJwtPayload } from '@/lib/authServer';
import { esCoordinadorDelCurso } from '@/lib/authServer';
import { puedeVerSyllabus } from '@/lib/syllabusPermisos';
import {
  CARPETA_SYLLABUS,
  rutaSyllabusInclusivo,
  urlSyllabusInclusivo,
  type FormatoInclusivo,
} from '@/lib/syllabusArchivos';
import { construirHtmlSyllabusInclusivo } from '@/lib/syllabusInclusivo/plantilla';
import { htmlAPdfEtiquetado } from '@/lib/pdfAccesible';
import {
  obtenerContextoPermiso,
  obtenerDatosSyllabusInclusivo,
  registrarGeneracionInclusivo,
} from '@/models/syllabusInclusivoModel';

type Resultado<T> = { ok: true; valor: T } | { ok: false; status: number; error: string };

/** Solo el coordinador dueño del curso puede generarlo (igual que los PDF ES/EN/中文) */
export async function generarSyllabusInclusivo(
  cursoId: number,
  usuario: CustomJwtPayload,
): Promise<Resultado<{ html: string; pdf: string }>> {
  if (!(await esCoordinadorDelCurso(usuario, cursoId))) {
    return { ok: false, status: 403, error: 'No autorizado' };
  }

  const datos = await obtenerDatosSyllabusInclusivo(cursoId);
  if (!datos) return { ok: false, status: 404, error: 'Curso no encontrado' };

  const html = construirHtmlSyllabusInclusivo(datos);
  const pdf = await htmlAPdfEtiquetado(html);

  await fs.mkdir(CARPETA_SYLLABUS, { recursive: true });
  await fs.writeFile(rutaSyllabusInclusivo(cursoId, 'html'), html, 'utf-8');
  await fs.writeFile(rutaSyllabusInclusivo(cursoId, 'pdf'), pdf);

  await registrarGeneracionInclusivo(cursoId, usuario.id, urlSyllabusInclusivo(cursoId, 'pdf'));

  return {
    ok: true,
    valor: { html: urlSyllabusInclusivo(cursoId, 'html'), pdf: urlSyllabusInclusivo(cursoId, 'pdf') },
  };
}

/** Mismas reglas de visibilidad que los otros PDF (lib/syllabusPermisos.ts) */
export async function obtenerArchivoInclusivo(
  cursoId: number,
  usuario: CustomJwtPayload,
  formato: FormatoInclusivo,
): Promise<Resultado<Buffer>> {
  const curso = await obtenerContextoPermiso(cursoId, usuario.id);
  if (!curso?.syllabus) return { ok: false, status: 404, error: 'Syllabus no encontrado' };

  const permitido = puedeVerSyllabus({
    rol: usuario.role,
    estado: curso.syllabus.estado,
    esCoordinadorDelCurso: curso.coordinadorId === usuario.id,
    esDocenteDelCurso: curso.cursodocente.length > 0,
  });
  if (!permitido) return { ok: false, status: 403, error: 'No autorizado' };

  try {
    return { ok: true, valor: await fs.readFile(rutaSyllabusInclusivo(cursoId, formato)) };
  } catch {
    return { ok: false, status: 404, error: 'El syllabus inclusivo todavía no fue generado' };
  }
}
