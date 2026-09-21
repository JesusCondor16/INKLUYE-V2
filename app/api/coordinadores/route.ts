// app/api/coordinadores/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Ajusta el filtro role si en tu DB usan otro valor
    const coordinadores = await prisma.user.findMany({
      where: { role: "coordinador" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(coordinadores, { status: 200 });
  } catch (err: unknown) {
    console.error("❌ GET /api/coordinadores error:", err);

    const message = err instanceof Error ? err.message : "Error desconocido";

    return NextResponse.json(
      { error: "Error al obtener coordinadores", detalle: message },
      { status: 500 }
    );
  }
}