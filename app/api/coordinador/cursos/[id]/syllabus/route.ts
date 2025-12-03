// app/api/coordinador/cursos/syllabus/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getCursosDelCoordinador } from "@/models/CoordinadorModel";
import { obtenerUsuarioDesdeTokenServer } from "@/lib/authServer";

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Obtener ID del curso desde la URL
    const { pathname } = req.nextUrl;
    const idStr = pathname.split("/").pop(); // toma el último segmento
    const cursoId = Number(idStr);

    if (!cursoId || isNaN(cursoId)) {
      return NextResponse.json({ success: false, error: "ID de curso inválido" }, { status: 400 });
    }

    // 2️⃣ Obtener usuario logueado desde cookie JWT
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) return NextResponse.json({ success: false, error: "Usuario no autenticado" }, { status: 401 });

    // 3️⃣ Obtener todos los cursos del coordinador
    const cursos = await getCursosDelCoordinador(usuario.id);

    // 4️⃣ Buscar el curso específico
    const curso = cursos.find(c => c.id === cursoId);
    if (!curso) return NextResponse.json({ success: false, error: "Curso no encontrado" }, { status: 404 });

    // 5️⃣ Retornar curso
    return NextResponse.json({ success: true, data: curso });
  } catch (error: any) {
    console.error("❌ Error GET /api/coordinador/cursos/syllabus/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener el curso", details: error.message },
      { status: 500 }
    );
  }
}
