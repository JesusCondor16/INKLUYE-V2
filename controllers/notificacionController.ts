// controllers/notificacionController.ts
import { NextResponse } from 'next/server';
import type { CustomJwtPayload } from '@/lib/authServer';
import { notificacionModel } from '@/models/notificacionModel';

export const notificacionController = {
  /** Notificaciones recientes y cantidad sin leer del usuario logueado */
  async listar(usuario: CustomJwtPayload) {
    try {
      const [notificaciones, noLeidas] = await Promise.all([
        notificacionModel.listarPorUsuario(usuario.id),
        notificacionModel.contarNoLeidas(usuario.id),
      ]);
      return NextResponse.json({ noLeidas, notificaciones }, { status: 200 });
    } catch (error: unknown) {
      console.error('❌ Error notificacionController.listar:', error);
      return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 });
    }
  },

  async marcarLeida(usuario: CustomJwtPayload, id: number) {
    try {
      const ok = await notificacionModel.marcarLeida(id, usuario.id);
      if (!ok) return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 });
      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error: unknown) {
      console.error('❌ Error notificacionController.marcarLeida:', error);
      return NextResponse.json({ error: 'Error al actualizar la notificación' }, { status: 500 });
    }
  },

  async marcarTodasLeidas(usuario: CustomJwtPayload) {
    try {
      await notificacionModel.marcarTodasLeidas(usuario.id);
      return NextResponse.json({ ok: true }, { status: 200 });
    } catch (error: unknown) {
      console.error('❌ Error notificacionController.marcarTodasLeidas:', error);
      return NextResponse.json({ error: 'Error al actualizar las notificaciones' }, { status: 500 });
    }
  },
};
