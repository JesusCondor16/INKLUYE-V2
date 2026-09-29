// models/syllabusFlujoModel.ts
import prisma from '@/lib/prisma';
import type { AccionSyllabus, EstadoSyllabus } from '@prisma/client';

export interface NuevaNotificacion {
  usuarioId: number;
  mensaje: string;
  enlace: string;
}

interface DatosTransicion {
  syllabusId: number;
  estadoEsperado: EstadoSyllabus;
  nuevoEstado: EstadoSyllabus;
  accion: AccionSyllabus;
  usuarioId: number;
  observacion: string | null;
  notificaciones: NuevaNotificacion[];
}

export const syllabusFlujoModel = {
  /**
   * Curso con su coordinador, docentes asignados y estado del syllabus
   * @param courseId - ID del curso
   */
  async obtenerContextoCurso(courseId: number) {
    return prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        code: true,
        name: true,
        coordinadorId: true,
        user: { select: { id: true, name: true } },
        cursodocente: { select: { user: { select: { id: true, name: true } } } },
        syllabus: { select: { id: true, estado: true } },
      },
    });
  },

  /**
   * Historial del syllabus, del mas reciente al mas antiguo
   * @param syllabusId - ID del syllabus
   */
  async obtenerHistorial(syllabusId: number) {
    return prisma.syllabushistorial.findMany({
      where: { syllabusId },
      orderBy: { fecha: 'desc' },
      select: {
        id: true,
        accion: true,
        observacion: true,
        fecha: true,
        usuario: { select: { name: true, role: true } },
      },
    });
  },

  /**
   * Cursos con syllabus en revision donde el usuario esta asignado como docente
   * @param usuarioId - ID del usuario (docente o coordinador que dicta el curso)
   */
  async listarPendientesDeRevision(usuarioId: number) {
    return prisma.course.findMany({
      where: {
        cursodocente: { some: { userId: usuarioId } },
        syllabus: { estado: 'ENVIADO_DOCENTE' },
      },
      select: {
        id: true,
        code: true,
        name: true,
        user: { select: { name: true } },
        syllabus: { select: { pdfUrl: true, updatedAt: true } },
      },
      orderBy: { name: 'asc' },
    });
  },

  /** IDs de todos los usuarios con rol estudiante */
  async listarIdsEstudiantes() {
    const estudiantes = await prisma.user.findMany({
      where: { role: 'estudiante' },
      select: { id: true },
    });
    return estudiantes.map((e) => e.id);
  },

  /**
   * Cambia el estado, registra el historial y crea las notificaciones en una sola transaccion.
   * Devuelve false si el estado ya no era el esperado (otro usuario lo cambio antes).
   */
  async aplicarTransicion(datos: DatosTransicion): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
      const { count } = await tx.syllabus.updateMany({
        where: { id: datos.syllabusId, estado: datos.estadoEsperado },
        data: { estado: datos.nuevoEstado, updatedAt: new Date() },
      });
      if (count === 0) return false;

      await tx.syllabushistorial.create({
        data: {
          syllabusId: datos.syllabusId,
          accion: datos.accion,
          usuarioId: datos.usuarioId,
          observacion: datos.observacion,
        },
      });

      if (datos.notificaciones.length > 0) {
        await tx.notificacion.createMany({ data: datos.notificaciones });
      }
      return true;
    });
  },
};
