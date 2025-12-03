import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const cursoId = parseInt(id, 10);
  if (isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  try {
    const course = await prisma.course.findUnique({
      where: { id: cursoId },
      include: {
        competencia: true,
        logro: true,
        capacidad: { include: { programacioncontenido: true } },
        estrategiadidactica: true, // ✅ CORRECTO
        recursos: true,
        bibliografia: true,
        matrizevaluacion: true,
      },
    });

    if (!course) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    return NextResponse.json({
      course,
      competencias: course.competencia,
      logros: course.logro,
      capacidades: course.capacidad,
      estrategias: course.estrategiadidactica,
      recursos: course.recursos,
      bibliografia: course.bibliografia,
      matrizEvaluacion: course.matrizevaluacion,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error al cargar curso", detalle: String(err) }, { status: 500 });
  }
}
