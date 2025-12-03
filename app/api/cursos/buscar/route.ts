// app/api/cursos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cursoModel } from "@/models/cursoModel";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() || "";

    // 🔍 Cargar cursos desde el modelo con relaciones
    // Asegúrate de que cursoModel.findAll() haga include del syllabus
    let cursos = await cursoModel.findAll();

    // 🔎 Filtrado local por código o nombre
    if (q.length > 0) {
      const qLower = q.toLowerCase();
      cursos = cursos.filter(
        (c: any) =>
          (c.name ?? "").toLowerCase().includes(qLower) ||
          (c.code ?? "").toLowerCase().includes(qLower)
      );
    }

    // 🟢 Mapeo garantizando que syllabusUrl venga correctamente del BD
    const mapped = cursos.map((c: any) => {
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        cycle: c.cycle,
        credits: c.credits,
        user: c.user ?? null,
        cursodocente: c.cursodocente ?? [],

        // ⭐ Aquí jala el PDF REAL guardado en la BD
        syllabusUrl: c.syllabus?.pdfUrl || null,
      };
    });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });

  } catch (err: any) {
    console.error("❌ Error GET /api/cursos/buscar:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener cursos",
        details: err.message,
      },
      { status: 500 }
    );
  }
}
