// controllers/syllabusFlujoController.ts
// Flujo de publicacion del syllabus: coordinador envia -> docente publica o devuelve.
import { NextResponse } from 'next/server';
import type { CustomJwtPayload } from '@/lib/authServer';
import { evaluarTransicion, esAccionFlujo, type AccionFlujo } from '@/lib/syllabusFlujo';
import { syllabusFlujoModel, type NuevaNotificacion } from '@/models/syllabusFlujoModel';
import { idiomasDisponibles } from '@/lib/syllabusArchivos';

type ContextoCurso = NonNullable<Awaited<ReturnType<typeof syllabusFlujoModel.obtenerContextoCurso>>>;

function rolesEnCurso(curso: ContextoCurso, usuario: CustomJwtPayload) {
  return {
    esCoordinadorDelCurso: curso.coordinadorId === usuario.id,
    esDocenteDelCurso: curso.cursodocente.some((cd) => cd.user.id === usuario.id),
  };
}

function nombreDelActor(curso: ContextoCurso, usuario: CustomJwtPayload): string {
  if (curso.user?.id === usuario.id) return curso.user.name;
  const docente = curso.cursodocente.find((cd) => cd.user.id === usuario.id);
  return docente?.user.name ?? 'Un usuario';
}

async function construirNotificaciones(
  accion: AccionFlujo,
  curso: ContextoCurso,
  usuario: CustomJwtPayload,
): Promise<NuevaNotificacion[]> {
  const nombreCurso = `${curso.code} - ${curso.name}`;
  const actor = nombreDelActor(curso, usuario);

  switch (accion) {
    case 'ENVIAR':
      // Se avisa a todos los asignados al curso, menos a quien hizo la accion
      return curso.cursodocente.filter((cd) => cd.user.id !== usuario.id).map((cd) => ({
        usuarioId: cd.user.id,
        mensaje: `${actor} envió el syllabus de ${nombreCurso} para su revisión.`,
        enlace: '/docente/syllabus',
      }));

    case 'DEVOLVER':
      if (!curso.coordinadorId || curso.coordinadorId === usuario.id) return [];
      return [{
        usuarioId: curso.coordinadorId,
        mensaje: `${actor} devolvió el syllabus de ${nombreCurso} con observaciones.`,
        enlace: `/coordinador/${curso.id}/syllabus`,
      }];

    case 'PUBLICAR': {
      const estudiantes = await syllabusFlujoModel.listarIdsEstudiantes();
      const avisos: NuevaNotificacion[] = estudiantes.map((id) => ({
        usuarioId: id,
        mensaje: `Ya está disponible el syllabus de ${nombreCurso}.`,
        enlace: '/buscar',
      }));
      if (curso.coordinadorId && curso.coordinadorId !== usuario.id) {
        avisos.push({
          usuarioId: curso.coordinadorId,
          mensaje: `${actor} publicó el syllabus de ${nombreCurso} para los estudiantes.`,
          enlace: `/coordinador/${curso.id}/syllabus`,
        });
      }
      return avisos;
    }
  }
}

export const syllabusFlujoController = {
  /** Syllabus en revision de los cursos donde el usuario esta asignado como docente */
  async listarPendientes(usuario: CustomJwtPayload) {
    try {
      const cursos = await syllabusFlujoModel.listarPendientesDeRevision(usuario.id);
      const pendientes = cursos.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        coordinador: c.user?.name ?? '—',
        pdfUrl: c.syllabus?.pdfUrl ?? null,
        enviadoEn: c.syllabus?.updatedAt ?? null,
        idiomas: idiomasDisponibles(c.id).map(({ lang, url }) => ({ lang, url })),
      }));
      return NextResponse.json(pendientes, { status: 200 });
    } catch (error: unknown) {
      console.error('❌ Error syllabusFlujoController.listarPendientes:', error);
      return NextResponse.json({ error: 'Error al obtener los syllabus por revisar' }, { status: 500 });
    }
  },

  /** Estado actual e historial (solo director, coordinador del curso o docentes del curso) */
  async obtenerEstado(usuario: CustomJwtPayload, courseId: number) {
    try {
      const curso = await syllabusFlujoModel.obtenerContextoCurso(courseId);
      if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

      const { esCoordinadorDelCurso, esDocenteDelCurso } = rolesEnCurso(curso, usuario);
      const autorizado =
        usuario.role === 'director' ||
        (usuario.role === 'coordinador' && esCoordinadorDelCurso) ||
        esDocenteDelCurso;
      if (!autorizado) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

      if (!curso.syllabus) {
        return NextResponse.json({ estado: null, historial: [], idiomas: [] }, { status: 200 });
      }

      const historial = await syllabusFlujoModel.obtenerHistorial(curso.syllabus.id);
      return NextResponse.json(
        { estado: curso.syllabus.estado, historial, idiomas: idiomasDisponibles(courseId) },
        { status: 200 },
      );
    } catch (error: unknown) {
      console.error('❌ Error syllabusFlujoController.obtenerEstado:', error);
      return NextResponse.json({ error: 'Error al obtener el estado del syllabus' }, { status: 500 });
    }
  },

  /** Ejecuta ENVIAR / DEVOLVER / PUBLICAR segun las reglas de lib/syllabusFlujo.ts */
  async ejecutarAccion(req: Request, usuario: CustomJwtPayload, courseId: number) {
    try {
      let body: { accion?: unknown; observacion?: unknown };
      try {
        body = await req.json();
      } catch {
        return NextResponse.json({ error: 'Payload inválido (JSON esperado)' }, { status: 400 });
      }

      if (!esAccionFlujo(body.accion)) {
        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
      }
      const accion = body.accion;
      const observacion = typeof body.observacion === 'string' ? body.observacion : undefined;

      const curso = await syllabusFlujoModel.obtenerContextoCurso(courseId);
      if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
      if (!curso.syllabus) {
        return NextResponse.json({ error: 'Primero debe generarse el syllabus' }, { status: 409 });
      }

      const resultado = evaluarTransicion({
        accion,
        estadoActual: curso.syllabus.estado,
        rol: usuario.role,
        ...rolesEnCurso(curso, usuario),
        observacion,
      });
      if (!resultado.ok) {
        return NextResponse.json({ error: resultado.error }, { status: resultado.status });
      }

      const notificaciones = await construirNotificaciones(accion, curso, usuario);

      const aplicado = await syllabusFlujoModel.aplicarTransicion({
        syllabusId: curso.syllabus.id,
        estadoEsperado: curso.syllabus.estado,
        nuevoEstado: resultado.nuevoEstado,
        accion: resultado.accionHistorial,
        usuarioId: usuario.id,
        observacion: resultado.observacion,
        notificaciones,
      });
      if (!aplicado) {
        return NextResponse.json(
          { error: 'El estado del syllabus cambió mientras tanto. Recargue la página.' },
          { status: 409 },
        );
      }

      return NextResponse.json({ estado: resultado.nuevoEstado }, { status: 200 });
    } catch (error: unknown) {
      console.error('❌ Error syllabusFlujoController.ejecutarAccion:', error);
      return NextResponse.json({ error: 'Error al actualizar el syllabus' }, { status: 500 });
    }
  },
};
