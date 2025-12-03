// app/api/coordinador/cursos/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getCursosDelCoordinador } from '@/models/CoordinadorModel';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';

export async function GET(req: NextRequest) {
  try {
    // 1️⃣ Obtener usuario desde token server-side
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // 2️⃣ Obtener cursos filtrando por el coordinador logueado
    const cursos = await getCursosDelCoordinador(usuario.id);

    return NextResponse.json({ success: true, data: cursos });
  } catch (error: unknown) {
    console.error('❌ GET /api/coordinador/cursos error:', error);

    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      { success: false, error: 'Error al obtener cursos', details: message },
      { status: 500 }
    );
  }
}
