// app/api/competencias/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const competencias = await prisma.competencia.findMany({
      select: { codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    return NextResponse.json(competencias);
  } catch (error: unknown) {
    console.error('❌ Error GET /api/competencias:', error);

    const message = error instanceof Error ? error.message : 'Error desconocido';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
