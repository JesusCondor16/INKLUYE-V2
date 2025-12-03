// app/api/buscar-syllabus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buscarSyllabusController } from "@/controllers/buscarSyllabusController";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() || "";

    let cursos;

    if (q.length > 0) {
      // Buscar cursos por nombre o código
      cursos = await buscarSyllabusController.search(q);
    } else {
      // Si no hay query, traer todos los cursos
      cursos = await buscarSyllabusController.getAll();
    }

    return NextResponse.json({ success: true, data: cursos }, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ Error GET /api/buscar-syllabus:", err);

    // Validamos si err es un Error real
    const message = err instanceof Error ? err.message : "Error desconocido";

    return NextResponse.json(
      { success: false, error: "Error al obtener cursos", details: message },
      { status: 500 }
    );
  }
}
