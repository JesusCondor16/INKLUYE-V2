import { userModel } from '@/models/userModel';

/**
 * Lógica de negocio para la vista del director
 */
export const DirectorController = {
  /**
   * Obtener nombre del usuario por su ID
   * @param id - ID del usuario
   */
  async obtenerNombreUsuario(id: number | string): Promise<string> {
    if (!id) return 'Usuario';
    try {
      const usuario = await userModel.findById(Number(id));
      return usuario?.name || 'Usuario';
    } catch (error) {
      console.error('[DirectorController] Error al obtener usuario:', error);
      return 'Usuario';
    }
  },
};
