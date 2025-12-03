// src/models/CoordinadorModel.ts
import prisma from '@/lib/prisma';

export interface Docente {
  id: number;
  name: string;
  email: string;
}

export interface Coordinador {
  id: number;
  name: string;
  email: string;
}

export interface CursoDelCoordinador {
  id: number;
  name: string;
  code: string;
  type: string;
  area?: string | null;
  weeks?: number | null;
  theoryHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  semester?: string | null;
  cycle?: string | null;
  modality?: string | null;
  coordinador: Coordinador;
  docentes: Docente[];
}

/**
 * getCursosDelCoordinador - SERVER ONLY
 * Nota: asegúrate de no importar este módulo desde código cliente.
 */
export const getCursosDelCoordinador = async (
  coordinadorId: number
): Promise<CursoDelCoordinador[]> => {
  if (!coordinadorId || typeof coordinadorId !== 'number') return [];

  const cursos = await prisma.course.findMany({
    where: { coordinadorId }, // en tu schema la FK es coordinadorId
    include: {
      user: { select: { id: true, name: true, email: true } },
      cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
    orderBy: { name: 'asc' },
  });

  return cursos.map((curso) => ({
    id: curso.id,
    name: curso.name,
    code: curso.code,
    type: curso.type,
    area: curso.area,
    weeks: curso.weeks,
    theoryHours: curso.theoryHours,
    practiceHours: curso.practiceHours,
    labHours: curso.labHours,
    semester: curso.semester,
    cycle: curso.cycle,
    modality: curso.modality,
    coordinador: {
      id: curso.user?.id ?? 0,
      name: curso.user?.name ?? '',
      email: curso.user?.email ?? '',
    },
    docentes: curso.cursodocente.map((cd) => ({
      id: cd.user?.id ?? 0,
      name: cd.user?.name ?? '',
      email: cd.user?.email ?? '',
    })),
  }));
};
