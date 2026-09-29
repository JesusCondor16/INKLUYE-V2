// app/api/syllabus/por-revisar/route.ts
// GET: syllabus en revision de los cursos donde el usuario logueado esta asignado como docente
import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { syllabusFlujoController } from '@/controllers/syllabusFlujoController';

export async function GET(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  return syllabusFlujoController.listarPendientes(usuario);
}
