// app/api/cursos/[id]/capacidades/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, capacidad, programacioncontenido, Prisma } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

/** Tipos parciales para mapCapacidad */
type CapacidadConProgramacion = capacidad & { programacioncontenido?: programacioncontenido[] };

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
            logroUnidad: p.logroUnidad ?? "",
          }))
        : [],
  };
}

// ✅ GET
export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID de curso no proporcionado" }, { status: 400 });
    const cursoId = parseInt(id, 10);
    if (isNaN(cursoId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const capacidades = await prisma.capacidad.findMany({
      where: { cursoId },
      include: { programacioncontenido: true },
      orderBy: { id: "asc" },
    });

    return NextResponse.json({ cursoId, capacidades: capacidades.map(mapCapacidad) }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ GET /api/cursos/:id/capacidades error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al obtener capacidades", detalle: message }, { status: 500 });
  }
}

// ✅ POST
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "ID de curso no proporcionado" }, { status: 400 });
    const cursoId = parseInt(id, 10);
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
              const fila = f as {
                sem?: string;
                semana?: string;
                contenido?: string;
                actividades?: string;
                recursos?: string;
                estrategias?: string;
                logroUnidad?: string;
              };
              return {
                semana: fila.sem ?? fila.semana ?? "",
                contenido: fila.contenido ?? "",
                actividades: fila.actividades ?? "",
                recursos: fila.recursos ?? "",
                estrategias: fila.estrategias ?? "",
                logroUnidad: fila.logroUnidad ?? "",
              };
            })
          : [],
      };
    });

    // 👇 Tipado correcto para Prisma $transaction
    const ops: (Prisma.Prisma__CapacidadClient<capacidad> | Prisma.PrismaBatchPayload)[] = [];
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
                semana: f.semana,
                contenido: f.contenido,
                actividades: f.actividades,
                recursos: f.recursos,
                estrategias: f.estrategias,
                logroUnidad: f.logroUnidad,
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

    return NextResponse.json(
      {
        message: "Capacidades reemplazadas correctamente",
        deleted: (results[0] as Prisma.PrismaBatchPayload).count ?? 0,
        capacidades: freshCaps.map(mapCapacidad),
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("❌ POST /api/cursos/:id/capacidades error:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: "Error al guardar capacidades", detalle: message }, { status: 500 });
  }
}
