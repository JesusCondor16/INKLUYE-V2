// app/api/competencias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

// Catalogo de competencias: lo usa el formulario del syllabus (coordinador) y el director
export async function GET(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  if (!requiereRol(usuario, 'director', 'coordinador')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const competencias = await prisma.competencia.findMany({
      select: { codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    return NextResponse.json(competencias);
  } catch (error: unknown) {
    console.error('❌ Error GET /api/competencias:', error);

    return NextResponse.json({ error: 'Error al obtener competencias' }, { status: 500 });
  }
}