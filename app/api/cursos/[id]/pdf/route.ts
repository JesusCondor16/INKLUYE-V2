import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta la ruta si tu prisma helper está en otro lugar

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cursoId = parseInt(id, 10);

    if (isNaN(cursoId))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const course = await prisma.course.findUnique({
      where: { id: cursoId },
      include: {
        competencia: true,
        logro: true,
        capacidad: { include: { programacioncontenido: true } },
        estrategiasdidactica: true, // ← corregido
        recursos: true,
        bibliografia: true,
        matrizevaluacion: true,
      },
    });

    if (!course)
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const competencias = course.competencia;
    const logros = course.logro;
    const capacidades = course.capacidad;
    const estrategias = course.estrategiadidactica; // ← corregido
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
    return NextResponse.json({ error: "Error al cargar curso" }, { status: 500 });
  }
}
