import { NextRequest, NextResponse } from 'next/server';
import { docenteController } from '@/controllers/docenteController';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

export async function GET() {
  return await docenteController.getAll();
}

export async function POST(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  if (!requiereRol(usuario, 'director')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return await docenteController.create(req);
}
