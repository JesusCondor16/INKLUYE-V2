// controllers/buscarSyllabusController.ts
import { buscarSyllabusModel } from "@/models/buscarSyllabusModel";

export const buscarSyllabusController = {
  async getAll() {
    const cursos = await buscarSyllabusModel.findAll();
    return cursos.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      cycle: c.cycle,
      credits: c.credits,
      coordinador: c.user?.name ?? '—',
      docentes: c.cursodocente?.map(d => d.user.name) ?? [],
      syllabusUrl: c.syllabus?.pdfUrl ?? null,
    }));
  },

  async search(query: string) {
    const cursos = await buscarSyllabusModel.search(query);
    return cursos.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      cycle: c.cycle,
      credits: c.credits,
      coordinador: c.user?.name ?? '—',
      docentes: c.cursodocente?.map(d => d.user.name) ?? [],
      syllabusUrl: c.syllabus?.pdfUrl ?? null,
    }));
  },

  async getById(id: number) {
    const c = await buscarSyllabusModel.findById(id);
    if (!c) return null;
    return {
      id: c.id,
      code: c.code,
      name: c.name,
      type: c.type,
      cycle: c.cycle,
      credits: c.credits,
      coordinador: c.user?.name ?? '—',
      docentes: c.cursodocente?.map(d => d.user.name) ?? [],
      syllabusUrl: c.syllabus?.pdfUrl ?? null,
    };
  },
};
