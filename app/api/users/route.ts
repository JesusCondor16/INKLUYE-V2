// app/api/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

// Antes respondia sin sesion: cualquiera podia listar nombres, correos y roles de todos
export async function GET(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  if (!requiereRol(usuario, 'director')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return userController.getAll(req);
}

export async function POST(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  if (!requiereRol(usuario, 'director')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  return userController.create(req);
}