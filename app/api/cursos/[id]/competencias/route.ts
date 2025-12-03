import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ajusta la ruta si tu prisma helper está en otro lugar

type Params = { id?: string };

/**
 * GET /api/cursos/:id/competencias
 * Devuelve { competencias: [...], logros: [...] }
 */
export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const idStr = params?.id;
    if (!idStr) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    const cursoId = parseInt(idStr, 10);
    if (Number.isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // Intentamos primero traer competencias donde competencia.cursoId = cursoId
    let competencias = await prisma.competencia.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true, cursoId: true },
      orderBy: { codigo: "asc" },
    });

    // Si no hay competencias directas, intentamos por pivote coursecompetencia (por compatibilidad)
    if (competencias.length === 0) {
      
      try {
        const raw = await prisma.$queryRawUnsafe(
          `SELECT c.id, c.codigo, c.descripcion, c.tipo, c.nivel, c.cursoId
           FROM coursecompetencia cc
           JOIN competencia c ON c.id = cc.competenciaId
           WHERE cc.cursoId = ? 
           ORDER BY c.codigo`,
          cursoId
        );
        if (Array.isArray(raw) && raw.length > 0) competencias = raw as any;
      } catch (e) {
        // si la tabla pivot no existe o falla, simplemente seguimos con competencias vacías
        // console.warn('Error consultando pivot coursecompetencia (posiblemente no exista):', e);
      }
    }

    // Logros asociados al curso
    const logros = await prisma.logro.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: "asc" },
    });

    return NextResponse.json({ competencias, logros }, { status: 200 });
  } catch (error: any) {
    console.error("GET /api/cursos/[id]/competencias error:", error);
    return NextResponse.json({ error: "Error al obtener competencias del curso", detalle: String(error) }, { status: 500 });
  }
}


export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const idStr = params?.id;
    if (!idStr) return NextResponse.json({ error: "ID no proporcionado" }, { status: 400 });
    const cursoId = parseInt(idStr, 10);
    if (Number.isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const data = await request.json().catch(() => null);
    if (!data) return NextResponse.json({ error: "Body inválido o no JSON" }, { status: 400 });

    const competenciasInput: any[] = Array.isArray(data.competencias) ? data.competencias : [];
    const logrosGlobalInput: any[] = Array.isArray(data.logros) ? data.logros : [];

    // Validación básica de estructura
    if (!Array.isArray(competenciasInput) || competenciasInput.some((c) => !c.codigo || !c.descripcion)) {
      return NextResponse.json({ error: "Formato inválido: cada competencia requiere codigo y descripcion" }, { status: 400 });
    }

    // Ejecutar en transacción: borrar previos y crear nuevos
    const result = await prisma.$transaction(async (tx) => {
      // 1) Eliminar competencias previas del curso
      await tx.competencia.deleteMany({ where: { cursoId } });

      // 2) Eliminar logros previos del curso
      await tx.logro.deleteMany({ where: { cursoId } });

      // 3) Crear competencias nuevas (una por una para poder crear logros vinculados)
      const createdCompetencias: any[] = [];
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

        // si la competencia trae logros anidados, créalos ligados al curso
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

      // 4) Si el body tiene logros globales (data.logros) los creamos también
      if (logrosGlobalInput.length > 0) {
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
      }

      return { competenciasCount: createdCompetencias.length, logrosCount: (await tx.logro.count({ where: { cursoId } })) };
    });

    return NextResponse.json({ message: "Competencias y logros actualizados", resultado: result }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/cursos/[id]/competencias error:", error);
    return NextResponse.json({ error: "Error al guardar competencias del curso", detalle: String(error) }, { status: 500 });
  }
}
