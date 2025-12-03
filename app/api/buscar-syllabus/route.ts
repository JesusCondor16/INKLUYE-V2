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
  } catch (err: any) {
    console.error("❌ Error GET /api/buscar-syllabus:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener cursos", details: err.message },
      { status: 500 }
    );
  }
}
