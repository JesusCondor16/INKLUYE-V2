// app/api/coordinadores/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export async function GET() {
  try {
    // Ajusta el filtro role si en tu DB usan otro valor
    const coordinadores = await prisma.user.findMany({
      where: { role: "coordinador" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(coordinadores, { status: 200 });
  } catch (err: any) {
    console.error("❌ GET /api/coordinadores error:", err);
    return NextResponse.json({ error: "Error al obtener coordinadores", detalle: err.message }, { status: 500 });
  }
}
