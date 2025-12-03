import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cursoId = parseInt(params.id);

  if (isNaN(cursoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    const course = await prisma.course.findUnique({
      where: { id: cursoId },
      include: {
        competencia: true,
        logros: true,
        capacidad: { include: { programacioncontenido: true } },
        estrategiasdidacticas: true,
        recursos: true,
        bibliografia: true,
        matrizevaluacion: true,
      },
    });

    if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Normalizamos competencias y logros
    const competencias = course.competencia;
    const logros = course.logro;
    const capacidades = course.capacidad;
    const estrategias = course.estrategiasdidacticas;
    const recursos = course.recursos;
    const bibliografia = course.bibliografia;
    const matrizEvaluacion = course.matrizevaluacion;

    return NextResponse.json({
      course,
      competencias,
      logros,
      capacidades,
      estrategias,
      recursos,
      bibliografia,
      matrizEvaluacion,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error al cargar curso' }, { status: 500 });
  }
}
