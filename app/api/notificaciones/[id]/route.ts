// app/api/notificaciones/[id]/route.ts
// PATCH: marcar una notificacion propia como leida
import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { notificacionController } from '@/controllers/notificacionController';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  const { id } = await context.params;
  const notificacionId = Number(id);
  if (!Number.isInteger(notificacionId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  return notificacionController.marcarLeida(usuario, notificacionId);
}
