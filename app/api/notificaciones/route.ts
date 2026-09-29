// app/api/notificaciones/route.ts
// GET: notificaciones del usuario logueado. PATCH: marcar todas como leidas.
import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { notificacionController } from '@/controllers/notificacionController';

export async function GET(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  return notificacionController.listar(usuario);
}

export async function PATCH(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  return notificacionController.marcarTodasLeidas(usuario);
}
