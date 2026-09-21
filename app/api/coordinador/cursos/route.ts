// app/api/coordinador/cursos/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { obtenerCursosCoordinadorLogueado } from '@/controllers/CoordinadorController';

export async function GET(req: NextRequest) {
  const { status, ...body } = await obtenerCursosCoordinadorLogueado(req);
  return NextResponse.json(body, { status });
}