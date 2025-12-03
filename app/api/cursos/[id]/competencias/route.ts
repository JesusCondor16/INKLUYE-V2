import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta la ruta si tu prisma helper está en otro lugar

type CompetenciaInput = {
  codigo: string;
  descripcion: string;
  tipo?: string;
  nivel?: string;
  logros?: LogroInput[];
};

type LogroInput = {
  codigo: string;
  descripcion: string;
  tipo?: string;
  nivel?: string;
};

// ✅ GET corregido
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    const cursoId = parseInt(id, 10);
    if (Number.isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // Intentamos primero traer competencias directas
    let competencias = await prisma.competencia.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true, cursoId: true },
      orderBy: { codigo: "asc" },
    });

    // Si no hay competencias directas, intentamos por pivote coursecompetencia
    if (competencias.length === 0) {
      try {
        const raw = await prisma.$queryRaw<
          { id: number; codigo: string; descripcion: string; tipo: string; nivel: string; cursoId: number }[]
        >(
          `SELECT c.id, c.codigo, c.descripcion, c.tipo, c.nivel, c.cursoId
           FROM coursecompetencia cc
           JOIN competencia c ON c.id = cc.competenciaId
           WHERE cc.cursoId = ? 
           ORDER BY c.codigo`,
          cursoId
        );
        if (Array.isArray(raw) && raw.length > 0) competencias = raw;
      } catch (e) {
        // tabla pivot posiblemente no exista, continuamos con competencias vacías
      }
    }

    // Logros asociados al curso
    const logros = await prisma.logro.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: "asc" },
    });

    return NextResponse.json({ competencias, logros }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cursos/[id]/competencias error:", error);
    return NextResponse.json(
      { error: "Error al obtener competencias del curso", detalle: String(error) },
      { status: 500 }
    );
  }
}

// ✅ POST corregido
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    const cursoId = parseInt(id, 10);
    if (Number.isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data = (await request.json().catch(() => null)) as
      | { competencias?: CompetenciaInput[]; logros?: LogroInput[] }
      | null;
    if (!data) return NextResponse.json({ error: "Body inválido o no JSON" }, { status: 400 });

    const competenciasInput: CompetenciaInput[] = Array.isArray(data.competencias) ? data.competencias : [];
    const logrosGlobalInput: LogroInput[] = Array.isArray(data.logros) ? data.logros : [];

    // Validación básica de estructura
    if (!competenciasInput.every((c) => c.codigo && c.descripcion)) {
      return NextResponse.json(
        { error: "Formato inválido: cada competencia requiere codigo y descripcion" },
        { status: 400 }
      );
    }

    // Ejecutar en transacción: borrar previos y crear nuevos
    const result = await prisma.$transaction(async (tx) => {
      await tx.competencia.deleteMany({ where: { cursoId } });
      await tx.logro.deleteMany({ where: { cursoId } });

      const createdCompetencias = [];
      for (const comp of competenciasInput) {
        const created = await tx.competencia.create({
          data: {
            codigo: comp.codigo,
            descripcion: comp.descripcion,
            tipo: comp.tipo ?? "",
            nivel: comp.nivel ?? "",
            cursoId,
          },
        });
        createdCompetencias.push(created);

        if (Array.isArray(comp.logros) && comp.logros.length > 0) {
          for (const logro of comp.logros) {
            await tx.logro.create({
              data: {
                codigo: logro.codigo ?? "",
                descripcion: logro.descripcion ?? "",
                tipo: logro.tipo ?? "",
                nivel: logro.nivel ?? "",
                cursoId,
              },
            });
          }
        }
      }

      // Logros globales
      for (const lg of logrosGlobalInput) {
        await tx.logro.create({
          data: {
            codigo: lg.codigo ?? "",
            descripcion: lg.descripcion ?? "",
            tipo: lg.tipo ?? "",
            nivel: lg.nivel ?? "",
            cursoId,
          },
        });
      }

      return {
        competenciasCount: createdCompetencias.length,
        logrosCount: await tx.logro.count({ where: { cursoId } }),
      };
    });

    return NextResponse.json({ message: "Competencias y logros actualizados", resultado: result }, { status: 200 });
  } catch (error) {
    console.error("POST /api/cursos/[id]/competencias error:", error);
    return NextResponse.json(
      { error: "Error al guardar competencias del curso", detalle: String(error) },
      { status: 500 }
    );
  }
}
