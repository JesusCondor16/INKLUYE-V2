export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
type Params = { id?: string };

export async function GET(_req: Request, context: { params: Params | Promise<Params> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

  const cursoId = parseInt(idStr, 10);
  if (Number.isNaN(cursoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
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

    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Relaciones con filtrado correcto
    const competencias = await prisma.competencia.findMany({ where: { cursoId } });
    const logros = await prisma.logro.findMany({ where: { cursoId } });
    const matriz = await prisma.matrizevaluacion.findMany({ where: { course: { id: cursoId } } });
    const bibliografia = await prisma.bibliografia.findMany({ where: { course: { id: cursoId } } });
    const estrategia = await prisma.estrategiadidactica.findMany({ where: { course: { id: cursoId } } });
    const recursos = await prisma.recurso.findMany({ where: { course: { id: cursoId } } });
    const capacidades = await prisma.capacidad.findMany({ where: { cursoId } });
    const programacion = await prisma.programacioncontenido.findMany({ where: { capacidad: { cursoId } } });
    const prerequisites = await prisma.prerequisite.findMany({ where: { course: { id: cursoId } } });
    const cursodocente = await prisma.cursodocente.findMany({ where: { courseId: cursoId } });

    const docenteIds = cursodocente.map(cd => cd.userId).filter((id): id is number => Boolean(id));
    const docentes = docenteIds.length
      ? await prisma.user.findMany({ where: { id: { in: docenteIds } } })
      : [];

    const pdfUrl = null; // no generamos PDF por ahora

    return NextResponse.json({
      curso,
      capacidades,
      competencias,
      logros,
      matriz,
      bibliografia,
      estrategia,
      recursos,
      programacion,
      prerequisites,
      cursodocente: docentes,
      url: pdfUrl,
      generated: false,
    });
  } catch (err: unknown) {
    console.error('Error en generarSyllabus route:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Error servidor', detalle: msg }, { status: 500 });
  }
}
