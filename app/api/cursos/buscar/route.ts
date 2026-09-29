// app/api/cursos/buscar/route.ts
import { NextRequest, NextResponse } from "next/server";
import type { EstadoSyllabus } from "@prisma/client";
import { cursoModel } from "@/models/cursoModel";
import { obtenerUsuarioDesdeTokenServer } from "@/lib/authServer";
import { puedeVerSyllabus } from "@/lib/syllabusPermisos";
import { idiomasDisponibles } from "@/lib/syllabusArchivos";

// Tipado de la estructura que devuelve cursoModel
type CursoRaw = {
  id: number;
  code: string;
  name: string;
  type?: string | null;
  cycle?: string | null;
  credits?: number | null;
  coordinadorId?: number | null;
  user?: { id: number; name: string } | null;
  cursodocente?: { user?: { id: number; name: string } }[];
  syllabus?: { pdfUrl?: string | null; estado: EstadoSyllabus } | null;
};

export async function GET(req: NextRequest) {
  try {
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ success: false, error: "Usuario no autenticado" }, { status: 401 });
    }

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

    // 🟢 El enlace al PDF solo se entrega si este usuario puede verlo segun el estado del syllabus
    const mapped = cursos.map((c) => {
      const visible =
        !!c.syllabus &&
        puedeVerSyllabus({
          rol: usuario.role,
          estado: c.syllabus.estado,
          esCoordinadorDelCurso: c.coordinadorId === usuario.id,
          esDocenteDelCurso: (c.cursodocente ?? []).some((cd) => cd.user?.id === usuario.id),
        });

      return {
        id: c.id,
        code: c.code,
        name: c.name,
        type: c.type,
        cycle: c.cycle,
        credits: c.credits,
        user: c.user ?? null,
        cursodocente: c.cursodocente ?? [],
        syllabusUrl: visible ? c.syllabus?.pdfUrl ?? null : null,
        // Enlaces por idioma (ES/EN/ZH) que existan, solo si el usuario puede verlos
        syllabusIdiomas: visible ? idiomasDisponibles(c.id).map(({ lang, url }) => ({ lang, url })) : [],
      };
    });

    return NextResponse.json({ success: true, data: mapped }, { status: 200 });

  } catch (err: unknown) {
    console.error("❌ Error GET /api/cursos/buscar:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener cursos",
      },
      { status: 500 }
    );
  }
}
