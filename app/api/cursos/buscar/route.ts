// app/api/cursos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cursoModel } from "@/models/cursoModel";

// Tipado de la estructura que devuelve cursoModel
type CursoRaw = {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  user?: { id: number; name: string } | null;
  cursodocente?: { user?: { id: number; name: string } }[];
  syllabus?: { pdfUrl?: string | null } | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() || "";

    // 🔍 Cargar cursos desde el modelo con relaciones
    let cursos: CursoRaw[] = await cursoModel.findAll();

    // 🔎 Filtrado local por código o nombre
    if (q.length > 0) {
      const qLower = q.toLowerCase();
      cursos = cursos.filter(
        (c) =>
          (c.name ?? "").toLowerCase().includes(qLower) ||
          (c.code ?? "").toLowerCase().includes(qLower)
      );
    }

    // 🟢 Mapeo garantizando que syllabusUrl venga correctamente del BD
    const mapped = cursos.map((c) => {
      return {
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        cycle: c.cycle,
        credits: c.credits,
        user: c.user ?? null,
        cursodocente: c.cursodocente ?? [],
        syllabusUrl: c.syllabus?.pdfUrl || null,
      };
    });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });

  } catch (err: unknown) {
    console.error("❌ Error GET /api/cursos/buscar:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener cursos",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
