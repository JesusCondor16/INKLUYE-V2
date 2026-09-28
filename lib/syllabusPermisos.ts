// lib/syllabusPermisos.ts
// Reglas de visibilidad del PDF de syllabus segun rol y estado.
// Funcion pura (sin Prisma ni Next) para poder probarla con Jest de forma aislada.
import type { EstadoSyllabus } from '@prisma/client';

export interface ContextoAccesoSyllabus {
  rol: string | undefined;
  estado: EstadoSyllabus;
  esCoordinadorDelCurso: boolean;
  esDocenteDelCurso: boolean;
}

export function puedeVerSyllabus(ctx: ContextoAccesoSyllabus): boolean {
  // El director supervisa todos los cursos
  if (ctx.rol === 'director') return true;

  // El coordinador duenio del curso lo ve en cualquier estado
  if (ctx.rol === 'coordinador' && ctx.esCoordinadorDelCurso) return true;

  // Publicado: visible para cualquier usuario autenticado
  if (ctx.estado === 'PUBLICADO') return true;

  // Enviado a revision: solo los asignados al curso en cursodocente (docentes o coordinadores que lo dictan)
  if (ctx.estado === 'ENVIADO_DOCENTE') {
    return ctx.esDocenteDelCurso;
  }

  // Borrador: nadie mas
  return false;
}
