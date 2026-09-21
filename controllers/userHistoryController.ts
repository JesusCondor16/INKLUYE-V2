import prisma from '@/lib/prisma';

interface CreateHistoryData {
  userId: number;
  changedBy: string;
  changedByRole: string;
  description: string;
}

export const userHistoryController = {

  /**
   * Crear registro de historial
   */
  async createHistory(data: CreateHistoryData) {

    try {

      const history = await prisma.userhistory.create({
        data: {
          userId: data.userId,
          changedBy: data.changedBy,
          changedByRole: data.changedByRole,
          description: data.description
        }
      });

      return history;

    } catch (error) {

      console.error('Error creando historial:', error);
      throw new Error('No se pudo registrar el historial');

    }

  },



  /**
   * Obtener historial de usuario
   */
  async getHistory(userId: number) {

    try {

      if (!Number.isFinite(userId) || userId <= 0) {
        throw new Error('ID inválido');
      }

      const history = await prisma.userhistory.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          changeDate: 'desc'
        }
      });

      return history ?? [];

    } catch (error) {

      console.error('Error al obtener historial:', error);
      throw new Error('No se pudo obtener el historial');

    }

  }

};