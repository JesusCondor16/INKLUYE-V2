import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

interface DecodedToken {
  id: number | string;
  [key: string]: unknown;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'No se encontró token de autenticación.' }, { status: 401 });
    }

    const decoded = verifyToken(token) as DecodedToken | null;
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json({ error: 'Token inválido o expirado.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      // Antes solo pedia name y email: el rol nunca llegaba y la pagina mostraba "N/A"
      select: { name: true, email: true, role: true },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no encontrado.' }, { status: 404 });

    return NextResponse.json({ user });
  } catch (err: unknown) {
    console.error('❌ Error en GET /api/perfil:', err);
    return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
  }
}
