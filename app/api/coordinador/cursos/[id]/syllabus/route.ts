// app/api/coordinador/cursos/[id]/syllabus/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getCursosDelCoordinador } from "@/models/CoordinadorModel";
import { obtenerUsuarioDesdeTokenServer } from "@/lib/authServer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const cursoId = Number(id);

    if (!cursoId || isNaN(cursoId)) {
      return NextResponse.json(
        { success: false, error: "ID de curso inválido" },
        { status: 400 }
      );
    }

    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario)
      return NextResponse.json(
        { success: false, error: "Usuario no autenticado" },
        { status: 401 }
      );

    const cursos = await getCursosDelCoordinador(usuario.id);

    const curso = cursos.find((c) => c.id === cursoId);
    if (!curso)
      return NextResponse.json(
        { success: false, error: "Curso no encontrado" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, data: curso });
  } catch (error: unknown) {
    console.error("❌ Error GET /api/coordinador/cursos/[id]/syllabus:", error);

    return NextResponse.json(
      { success: false, error: "Error al obtener el curso" },
      { status: 500 }
    );
  }
}