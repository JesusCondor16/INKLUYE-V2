// models/notificacionModel.ts
import prisma from '@/lib/prisma';

const LIMITE_NOTIFICACIONES = 20;

export const notificacionModel = {
  /**
   * Ultimas notificaciones del usuario, de la mas reciente a la mas antigua
   * @param usuarioId - ID del usuario
   */
  async listarPorUsuario(usuarioId: number) {
    return prisma.notificacion.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
      take: LIMITE_NOTIFICACIONES,
      select: { id: true, mensaje: true, enlace: true, leida: true, createdAt: true },
    });
  },

  /** Cantidad de notificaciones sin leer del usuario */
  async contarNoLeidas(usuarioId: number) {
    return prisma.notificacion.count({ where: { usuarioId, leida: false } });
  },

  /**
   * Marca una notificacion como leida solo si pertenece al usuario.
   * Devuelve false si no existe o es de otro usuario.
   */
  async marcarLeida(id: number, usuarioId: number): Promise<boolean> {
    const { count } = await prisma.notificacion.updateMany({
      where: { id, usuarioId },
      data: { leida: true },
    });
    return count > 0;
  },

  /** Marca todas las notificaciones del usuario como leidas */
  async marcarTodasLeidas(usuarioId: number) {
    await prisma.notificacion.updateMany({
      where: { usuarioId, leida: false },
      data: { leida: true },
    });
  },
};
