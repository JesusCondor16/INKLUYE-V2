// src/models/buscarSyllabusModel.ts
import prisma from '@/lib/prisma';

export const buscarSyllabusModel = {
  // Obtener todos los cursos con syllabus y relaciones
  async findAll() {
    return prisma.course.findMany({
      include: {
        user: { select: { id: true, name: true } }, // coordinador
        cursodocente: { include: { user: { select: { id: true, name: true } } } },
        syllabus: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  // Buscar cursos por nombre o código
  async search(query: string) {
    return prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { code: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: { select: { id: true, name: true } },
        cursodocente: { include: { user: { select: { id: true, name: true } } } },
        syllabus: true,
      },
      orderBy: { name: 'asc' },
    });
  },

  // Obtener curso por ID
  async findById(id: number) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true } },
        cursodocente: { include: { user: { select: { id: true, name: true } } } },
        syllabus: true,
      },
    });
  },
};
