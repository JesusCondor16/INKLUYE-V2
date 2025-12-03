// app/api/cursos/[id]/capacidades/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Capacidad, ProgramacionContenido } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

/** Tipos parciales para mapCapacidad */
type CapacidadConProgramacion = Capacidad & { programacioncontenido?: ProgramacionContenido[] };

/** Normaliza una capacidad para la respuesta */
function mapCapacidad(cap: CapacidadConProgramacion) {
  return {
    id: cap.id,
    nombre: cap.nombre,
    descripcion: cap.descripcion,
    filas:
      Array.isArray(cap.programacioncontenido) && cap.programacioncontenido.length > 0
        ? cap.programacioncontenido.map((p) => ({
            id: p.id ?? null,
            sem: p.semana ?? "",
            contenido: p.contenido ?? "",
            actividades: p.actividades ?? "",
            recursos: p.recursos ?? "",
            estrategias: p.estrategias ?? "",
            fixed: Boolean(p.fixed ?? false),
          }))
        : [],
  };
}

export async function GET(
  _req: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const idStr = params?.id;
    if (!idStr) return NextResponse.json({ error: "ID de curso no proporcionado" }, { status: 400 });
    const cursoId = parseInt(idStr, 10);
    if (isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const capacidades = await prisma.capacidad.findMany({
      where: { cursoId },
      include: { programacioncontenido: true },
      orderBy: { id: "asc" },
    });

    const mapped = capacidades.map(mapCapacidad);

    return NextResponse.json({ cursoId, capacidades: mapped }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ GET /api/cursos/:id/capacidades error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al obtener capacidades", detalle: message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id?: string } }
) {
  try {
    const idStr = params?.id;
    if (!idStr) return NextResponse.json({ error: "ID de curso no proporcionado" }, { status: 400 });
    const cursoId = parseInt(idStr, 10);
    if (isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Payload inválido: se espera un array de capacidades" }, { status: 400 });
    }

    const unidades = body.map((u: unknown) => {
      const unidad = u as { nombre?: string; descripcion?: string; filas?: unknown[] };
      return {
        nombre: String(unidad.nombre ?? "").trim(),
        descripcion: String(unidad.descripcion ?? "").trim(),
        filas: Array.isArray(unidad.filas)
          ? unidad.filas.map((f: unknown) => {
              const fila = f as { sem?: string; semana?: string; contenido?: string; actividades?: string; recursos?: string; estrategias?: string; fixed?: boolean };
              return {
                semana: fila.sem ?? fila.semana ?? "",
                contenido: fila.contenido ?? "",
                actividades: fila.actividades ?? "",
                recursos: fila.recursos ?? "",
                estrategias: fila.estrategias ?? "",
                fixed: Boolean(fila.fixed ?? false),
              };
            })
          : [],
      };
    });

    const ops: Promise<unknown>[] = [];
    ops.push(prisma.capacidad.deleteMany({ where: { cursoId } }));

    for (const u of unidades) {
      ops.push(
        prisma.capacidad.create({
          data: {
            nombre: u.nombre,
            descripcion: u.descripcion,
            cursoId,
            programacioncontenido: {
              create: u.filas.map((f) => ({
                semana: f.semana ?? "",
                contenido: f.contenido ?? "",
                actividades: f.actividades ?? "",
                recursos: f.recursos ?? "",
                estrategias: f.estrategias ?? "",
                ...(typeof f.fixed === "boolean" ? { fixed: f.fixed } : {}),
              })),
            },
          },
        })
      );
    }

    const results = await prisma.$transaction(ops);

    const createdCaps = results.slice(1) as CapacidadConProgramacion[];

    const createdIds = createdCaps.map((c) => c.id).filter(Boolean);
    const freshCaps =
      createdIds.length > 0
        ? await prisma.capacidad.findMany({
            where: { id: { in: createdIds } },
            include: { programacioncontenido: true },
            orderBy: { id: "asc" },
          })
        : [];

    const mapped = freshCaps.map(mapCapacidad);

    return NextResponse.json(
      { message: "Capacidades reemplazadas correctamente", deleted: (results[0] as { count?: number }).count ?? 0, capacidades: mapped },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ POST /api/cursos/:id/capacidades error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al guardar capacidades", detalle: message }, { status: 500 });
  }
}
