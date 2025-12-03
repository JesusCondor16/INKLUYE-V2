// controllers/cursoController.ts
import { cursoModel } from "@/models/cursoModel";

export const cursoController = {
  /**
   * Obtener todos los cursos (rol Director)
   */
  async getAllCursos() {
    const cursos = await cursoModel.findAll();
    return cursos.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      cycle: c.cycle,
      credits: c.credits,
      coordinador: c.user?.name ?? "—",
      docentes: c.cursodocente?.map(d => d.user.name) ?? [],
    }));
  },

  /**
   * Obtener curso por ID
   */
  async getById(id: number) {
    return await cursoModel.findById(id);
  },

  /**
   * Crear o actualizar curso (opcional, si lo vas a usar)
   */
  async createCurso(data: any) {
    return await cursoModel.create(data);
  },

  async updateCurso(id: number, data: any) {
    return await cursoModel.update(id, data);
  },
};
