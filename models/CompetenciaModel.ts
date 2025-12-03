import prisma from '@/lib/prisma'; // tu cliente Prisma

export interface Competencia {
  codigo: string;
  descripcion: string;
  tipo: string;
  nivel: string;
}

export class CompetenciaModel {
  static async obtenerTodas(): Promise<Competencia[]> {
    return prisma.competencia.findMany({
      select: {
        codigo: true,
        descripcion: true,
        tipo: true,
        nivel: true,
      },
      orderBy: { codigo: 'asc' },
    });
  }

  static async obtenerPorCurso(cursoId: number): Promise<Competencia[]> {
    return prisma.competencia.findMany({
      where: { cursoId },
      select: {
        codigo: true,
        descripcion: true,
        tipo: true,
        nivel: true,
      },
    });
  }
}
