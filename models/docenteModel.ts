// models/docenteModel.ts
import { userModel } from './userModel'; // Reusa el userModel para docentes/coordinadores

type FindAllOpts = { roles?: string[] };

export const docenteModel = {
  /**
   * findAll - obtiene usuarios por roles
   * Por defecto trae ['docente', 'coordinador'] si no se indica roles.
   */
  async findAll(opts?: FindAllOpts) {
    const roles = Array.isArray(opts?.roles) && opts!.roles.length > 0
      ? opts!.roles
      : ['docente', 'coordinador']; // <-- default ahora incluye ambos

    return userModel.findAll({ roles });
  },

  async findById(id: number) {
    return userModel.findById(id);
  },

  async create(data: { name: string; email: string; password: string }) {
    return userModel.create({ ...data, role: 'docente' });
    // Nota: si quieres poder crear coordinador también, modifica aquí o crea otra función
  },

  async update(id: number, data: Partial<{ name: string; email: string; password: string; role?: string }>) {
    return userModel.update(id, data);
  },

  async delete(id: number) {
    return userModel.delete(id);
  },
};
