import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';

// Devuelve el usuario de la sesion actual.
// Lee el token de la cookie httpOnly, igual que el resto de rutas
// (antes lo leia de un header Authorization armado desde localStorage)
export async function GET(req: NextRequest) {
  try {
    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ error: 'Sesión no iniciada o expirada.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(usuario.id) },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err: unknown) {
    console.error('❌ Error en GET /api/perfil:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
