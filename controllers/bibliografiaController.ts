import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const bibliografiaController = {
  async getByCurso(cursoId: number) {
    return await prisma.bibliografia.findMany({
      where: { courseId: cursoId },
      orderBy: { id: 'asc' },
    });
  },

  async updateByCurso(cursoId: number, bibliografias: { texto: string }[]) {
    // Primero borramos todas las bibliografías existentes para el curso
    await prisma.bibliografia.deleteMany({ where: { courseId: cursoId } });

    // Luego insertamos las nuevas
    return await prisma.bibliografia.createMany({
      data: bibliografias.map(b => ({ ...b, courseId: cursoId })),
    });
  },
};
