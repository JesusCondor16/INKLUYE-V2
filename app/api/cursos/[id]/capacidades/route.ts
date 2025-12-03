// app/api/cursos/[id]/capacidades/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

declare global {
  // avoid multiple PrismaClient instances in dev due to hot reload
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

/** Normaliza una capacidad para la respuesta */
function mapCapacidad(cap: any) {
  return {
    id: cap.id,
    nombre: cap.nombre,
    descripcion: cap.descripcion,
    // no incluir 'logro' porque la tabla capacidad en tu DB no lo tiene
    filas:
      Array.isArray(cap.programacioncontenido) && cap.programacioncontenido.length > 0
        ? cap.programacioncontenido.map((p: any) => ({
            id: p.id ?? null,
            sem: p.semana ?? "",
            contenido: p.contenido ?? "",
            actividades: p.actividades ?? "",
            recursos: p.recursos ?? "",
            estrategias: p.estrategias ?? "",
            fixed: Boolean((p as any).fixed ?? false),
          }))
        : [],
  };
}

/**
 * GET /api/cursos/:id/capacidades
 * Devuelve las capacidades y su programación de contenidos (filas)
 */
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
  } catch (error: any) {
    console.error("❌ GET /api/cursos/:id/capacidades error:", error);
    return NextResponse.json({ error: "Error al obtener capacidades", detalle: error.message }, { status: 500 });
  }
}

/**
 * POST /api/cursos/:id/capacidades
 * Reemplaza las capacidades del curso (delete many + create many con programación).
 *
 * Body esperado: array de unidades:
 * [
 *   {
 *     nombre: string,
 *     descripcion: string,
 *     filas?: [{ sem?: string, contenido?: string, actividades?: string, recursos?: string, estrategias?: string, fixed?: boolean }]
 *   },
 *   ...
 * ]
 */
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

    // Validación básica de contenido y normalización
    const unidades = body.map((u: any) => ({
      nombre: String(u.nombre ?? "").trim(),
      descripcion: String(u.descripcion ?? "").trim(),
      filas: Array.isArray(u.filas)
        ? u.filas.map((f: any) => ({
            semana: f.sem ?? f.semana ?? "",
            contenido: f.contenido ?? "",
            actividades: f.actividades ?? "",
            recursos: f.recursos ?? "",
            estrategias: f.estrategias ?? "",
            fixed: Boolean(f.fixed ?? false),
          }))
        : [],
    }));

    // Transacción: borrar capacidades previas y crear las nuevas con programación
    // Nota: usamos deleteMany + múltiples create(). Si tienes muchos registros y quieres optimizar,
    // puedes crear arrays para createMany, pero createMany no soporta nested create (programacioncontenido).
    const ops: any[] = [];
    ops.push(prisma.capacidad.deleteMany({ where: { cursoId } }));

    // crear cada capacidad con nested programacioncontenido.create
    for (const u of unidades) {
      ops.push(
        prisma.capacidad.create({
          data: {
            nombre: u.nombre,
            descripcion: u.descripcion,
            cursoId,
            programacioncontenido: {
              create: u.filas.map((f: any) => ({
                semana: f.semana ?? f.sem ?? "",
                contenido: f.contenido ?? "",
                actividades: f.actividades ?? "",
                recursos: f.recursos ?? "",
                estrategias: f.estrategias ?? "",
                // solo incluir fixed si ese campo existe en tu schema programacioncontenido
                ...(typeof f.fixed === "boolean" ? { fixed: f.fixed } : {}),
              })),
            },
          },
        })
      );
    }

    const results = await prisma.$transaction(ops);

    // results[0] = { count: X } del deleteMany, results[1..] = created capacidades
    const createdCaps = results.slice(1) as any[];

    // Para devolver, volverse a consultar las capacidades creadas completas (más seguro)
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
      { message: "Capacidades reemplazadas correctamente", deleted: (results[0] as any).count ?? 0, capacidades: mapped },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ POST /api/cursos/:id/capacidades error:", error);
    return NextResponse.json({ error: "Error al guardar capacidades", detalle: error.message }, { status: 500 });
  }
}
