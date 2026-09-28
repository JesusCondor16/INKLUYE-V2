// lib/syllabusFlujo.ts
// Maquina de estados del flujo de publicacion del syllabus:
//   BORRADOR --ENVIAR (coordinador)--> ENVIADO_DOCENTE --PUBLICAR (docente)--> PUBLICADO
//   ENVIADO_DOCENTE --DEVOLVER con observacion (docente)--> BORRADOR
// "Docente" = cualquier usuario asignado al curso en cursodocente, sea cual sea su rol
// (un coordinador tambien puede dictar un curso).
// Funcion pura (sin Prisma ni Next) para poder probarla con Jest de forma aislada.
import type { AccionSyllabus, EstadoSyllabus } from '@prisma/client';

export const ACCIONES_FLUJO = ['ENVIAR', 'DEVOLVER', 'PUBLICAR'] as const;
export type AccionFlujo = (typeof ACCIONES_FLUJO)[number];

export const MAX_OBSERVACION = 2000;

export function esAccionFlujo(valor: unknown): valor is AccionFlujo {
  return typeof valor === 'string' && (ACCIONES_FLUJO as readonly string[]).includes(valor);
}

export interface ContextoTransicion {
  accion: AccionFlujo;
  estadoActual: EstadoSyllabus;
  rol: string | undefined;
  esCoordinadorDelCurso: boolean;
  esDocenteDelCurso: boolean;
  observacion?: string;
}

export type ResultadoTransicion =
  | { ok: true; nuevoEstado: EstadoSyllabus; accionHistorial: AccionSyllabus; observacion: string | null }
  | { ok: false; status: 400 | 403 | 409; error: string };

export function evaluarTransicion(ctx: ContextoTransicion): ResultadoTransicion {
  switch (ctx.accion) {
    case 'ENVIAR':
      if (ctx.rol !== 'coordinador' || !ctx.esCoordinadorDelCurso) {
        return { ok: false, status: 403, error: 'Solo el coordinador del curso puede enviar el syllabus' };
      }
      if (ctx.estadoActual !== 'BORRADOR') {
        return { ok: false, status: 409, error: 'Solo se puede enviar un syllabus en borrador' };
      }
      return { ok: true, nuevoEstado: 'ENVIADO_DOCENTE', accionHistorial: 'ENVIADO', observacion: null };

    case 'DEVOLVER': {
      if (!ctx.esDocenteDelCurso) {
        return { ok: false, status: 403, error: 'Solo un docente del curso puede devolver el syllabus' };
      }
      if (ctx.estadoActual !== 'ENVIADO_DOCENTE') {
        return { ok: false, status: 409, error: 'Solo se puede devolver un syllabus enviado a revisión' };
      }
      const observacion = (ctx.observacion ?? '').trim();
      if (!observacion) {
        return { ok: false, status: 400, error: 'Debe indicar las observaciones' };
      }
      if (observacion.length > MAX_OBSERVACION) {
        return { ok: false, status: 400, error: `Las observaciones no pueden superar ${MAX_OBSERVACION} caracteres` };
      }
      return { ok: true, nuevoEstado: 'BORRADOR', accionHistorial: 'DEVUELTO', observacion };
    }

    case 'PUBLICAR':
      if (!ctx.esDocenteDelCurso) {
        return { ok: false, status: 403, error: 'Solo un docente del curso puede publicar el syllabus' };
      }
      if (ctx.estadoActual !== 'ENVIADO_DOCENTE') {
        return { ok: false, status: 409, error: 'Solo se puede publicar un syllabus enviado a revisión' };
      }
      return { ok: true, nuevoEstado: 'PUBLICADO', accionHistorial: 'PUBLICADO', observacion: null };
  }
}
