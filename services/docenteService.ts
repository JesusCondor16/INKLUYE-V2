// services/docenteService.ts
import { docenteModel } from '@/models/docenteModel';

type CreateDocenteDTO = { name: string; email: string; password: string };
type UpdateDocenteDTO = Partial<{ name: string; email: string; password: string; role?: string }>;

export const docenteService = {
  /**
   * getAll - por defecto trae docentes + coordinadores
   * Si quieres pasar roles específicas, pásalas como argumento (ej: ['docente'])
   */
  async getAll(opts?: { roles?: string[] }) {
    return docenteModel.findAll(opts);
  },

  async getById(id: number) {
    if (!id || Number.isNaN(id)) throw new Error('ID inválido');
    return docenteModel.findById(id);
  },

  async create(data: CreateDocenteDTO) {
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const password = data.password || '';

    if (!name || !email || !password) throw new Error('Faltan datos obligatorios');
    // validación mínima
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email)) throw new Error('Email inválido');

    return docenteModel.create({ name, email, password });
  },

  async update(id: number, data: UpdateDocenteDTO) {
    if (!id || Number.isNaN(id)) throw new Error('ID inválido');

    const payload: Partial<{ name: string; email: string; password: string; role?: string }> = {};

    if (data.name !== undefined) {
      const nm = (data.name || '').trim();
      if (!nm) throw new Error('Nombre vacío');
      payload.name = nm;
    }

    if (data.email !== undefined) {
      const em = (data.email || '').trim().toLowerCase();
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(em)) throw new Error('Email inválido');
      payload.email = em;
    }

    if (data.password !== undefined) {
      if ((data.password || '').length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');
      payload.password = data.password; // o hashearla aquí
    }

    if (data.role !== undefined) {
      payload.role = data.role;
    }

    const updated = await docenteModel.update(id, payload);
    if (!updated) throw new Error('No se pudo actualizar el docente/coordinador');
    return updated;
  },

  async remove(id: number) {
    if (!id || Number.isNaN(id)) throw new Error('ID inválido');
    return docenteModel.delete(id);
  },
};
