export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { id?: string };

export async function GET(_req: Request, context: { params: Params | Promise<Params> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

  const cursoId = parseInt(idStr, 10);
  if (Number.isNaN(cursoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    // Traer datos principales del curso
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
        group: true,
      },
    });

    if (!curso) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Relaciones y datos necesarios para el syllabus
    const competencias = await prisma.competencia.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    const logros = await prisma.logro.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    const matriz = await prisma.matrizevaluacion.findMany({
      where: { courseId: cursoId },
      orderBy: { unidad: 'asc' },
      select: { unidad: true, criterio: true, producto: true, instrumento: true, nota_peso: true, nota_sum: true },
    });

    const bibliografia = await prisma.bibliografia.findMany({
      where: { courseId: cursoId },
      orderBy: { id: 'asc' },
      select: { id: true, texto: true },
    });

    const estrategia = await prisma.estrategiadidactica.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, texto: true },
    });

    const recursos = await prisma.recurso.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, descripcion: true },
    });

    const capacidades = await prisma.capacidad.findMany({
      where: { cursoId },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, descripcion: true, cursoId: true },
    });

    const programacion = await prisma.programacioncontenido.findMany({
      where: { capacidad: { cursoId } },
      orderBy: { semana: 'asc' },
      select: {
        id: true,
        logroUnidad: true,
        semana: true,
        contenido: true,
        actividades: true,
        recursos: true,
        estrategias: true,
        capacidadId: true,
      },
    });

    const prerequisites = await prisma.prerequisite.findMany({
      where: { courseId: cursoId },
      select: { prerequisiteId: true },
    });

    const cursodocente = await prisma.cursodocente.findMany({
      where: { courseId: cursoId },
      select: { userId: true },
    });
    const docenteIds = cursodocente.map(cd => cd.userId).filter((id): id is number => Boolean(id));

    const docentes = docenteIds.length
      ? await prisma.user.findMany({ where: { id: { in: docenteIds } }, select: { id: true, name: true, email: true } })
      : [];

    return NextResponse.json(
      {
        curso,
        capacidades,
        capacidad: capacidades,
        competencias,
        logros,
        matriz,
        bibliografia,
        estrategia,
        recursos,
        programacion,
        prerequisites,
        cursodocente: docentes,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    console.error('Error en generarSyllabus route:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Error servidor', detalle: msg }, { status: 500 });
  }
}