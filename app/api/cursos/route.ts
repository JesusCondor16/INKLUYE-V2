// app/api/cursos/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Director: traer todos los cursos con sus docentes y coordinador
    const cursos = await prisma.course.findMany({
      include: {
        cursodocente: { include: { user: true } }, // docentes asignados
        user: true, // coordinador asignado
      },
    });

    return NextResponse.json({ success: true, data: cursos });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error al obtener cursos', 
        detalle: err instanceof Error ? err.message : String(err) 
      },
      { status: 500 }
    );
  }
}
