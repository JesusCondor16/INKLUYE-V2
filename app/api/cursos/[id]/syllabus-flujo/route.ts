// app/api/cursos/[id]/syllabus-flujo/route.ts
// GET: estado + historial del syllabus. POST { accion: 'ENVIAR' | 'DEVOLVER' | 'PUBLICAR', observacion? }
import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { syllabusFlujoController } from '@/controllers/syllabusFlujoController';

type Contexto = { params: Promise<{ id: string }> };

async function leerCourseId(context: Contexto): Promise<number | null> {
  const { id } = await context.params;
  const courseId = Number(id);
  return Number.isInteger(courseId) ? courseId : null;
}

export async function GET(req: NextRequest, context: Contexto) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  const courseId = await leerCourseId(context);
  if (courseId === null) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  return syllabusFlujoController.obtenerEstado(usuario, courseId);
}

export async function POST(req: NextRequest, context: Contexto) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  const courseId = await leerCourseId(context);
  if (courseId === null) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  return syllabusFlujoController.ejecutarAccion(req, usuario, courseId);
}
