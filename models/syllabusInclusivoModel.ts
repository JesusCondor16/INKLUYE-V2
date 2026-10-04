// models/syllabusInclusivoModel.ts
// Lee de la base todo lo que necesita el "Syllabus inclusivo" (lib/syllabusInclusivo/plantilla.ts)
import { prisma } from '@/lib/prisma';
import type { DatosSyllabusInclusivo } from '@/lib/syllabusInclusivo/tipos';

export async function obtenerDatosSyllabusInclusivo(cursoId: number): Promise<DatosSyllabusInclusivo | null> {
  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    select: {
      id: true,
      name: true,
      code: true,
      sumilla: true,
      credits: true,
      type: true,
      area: true,
      weeks: true,
      theoryHours: true,
      practiceHours: true,
      labHours: true,
      semester: true,
      cycle: true,
      modality: true,
      user: { select: { name: true } }, // coordinador
      cursodocente: { select: { user: { select: { name: true } } } },
      prerequisite_prerequisite_courseIdTocourse: {
        select: { course_prerequisite_prerequisiteIdTocourse: { select: { name: true } } },
      },
    },
  });
  if (!curso) return null;

  const [competencias, logros, capacidades, programacion, estrategia, recursos, matriz, bibliografia] =
    await Promise.all([
      prisma.competencia.findMany({
        where: { cursoId },
        select: { codigo: true, descripcion: true, tipo: true, nivel: true },
        orderBy: { codigo: 'asc' },
      }),
      prisma.logro.findMany({ where: { cursoId }, select: { codigo: true, descripcion: true }, orderBy: { codigo: 'asc' } }),
      prisma.capacidad.findMany({ where: { cursoId }, select: { id: true, nombre: true, descripcion: true }, orderBy: { id: 'asc' } }),
      prisma.programacioncontenido.findMany({
        where: { capacidad: { cursoId } },
        select: {
          capacidadId: true,
          semana: true,
          logroUnidad: true,
          contenido: true,
          actividades: true,
          recursos: true,
          estrategias: true,
        },
      }),
      prisma.estrategiadidactica.findMany({ where: { cursoId }, select: { texto: true }, orderBy: { createdAt: 'asc' } }),
      prisma.recurso.findMany({ where: { cursoId }, select: { descripcion: true }, orderBy: { createdAt: 'asc' } }),
      prisma.matrizevaluacion.findMany({
        where: { courseId: cursoId },
        select: { unidad: true, criterio: true, producto: true, instrumento: true, nota_peso: true, nota_sum: true },
        orderBy: { unidad: 'asc' },
      }),
      prisma.bibliografia.findMany({ where: { courseId: cursoId }, select: { texto: true, categoria: true }, orderBy: { id: 'asc' } }),
    ]);

  const { user, cursodocente, prerequisite_prerequisite_courseIdTocourse: prereq, ...datosCurso } = curso;

  return {
    curso: datosCurso,
    coordinador: user?.name ?? null,
    docentes: cursodocente.map((cd) => cd.user.name),
    prerequisitos: prereq.map((p) => p.course_prerequisite_prerequisiteIdTocourse.name),
    competencias: competencias.map((k) => ({ ...k, descripcion: k.descripcion ?? '' })),
    logros,
    capacidades,
    programacion,
    estrategia: estrategia.map((e) => e.texto),
    recursos: recursos.map((r) => r.descripcion),
    matriz: matriz.map((m) => ({
      unidad: m.unidad,
      criterio: m.criterio,
      producto: m.producto,
      instrumento: m.instrumento,
      peso: m.nota_peso,
      // Si no tiene nombre de nota se usa N + unidad (N1, N2...)
      nota: m.nota_sum ?? `N${m.unidad}`,
    })),
    bibliografia: bibliografia.map((b) => ({ texto: b.texto, categoria: b.categoria })),
    generadoEn: new Date().toISOString(),
  };
}
