// app/api/auth/renovar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { generateToken, verifyToken } from '@/lib/jwt';

// "Seguir conectado" (WCAG 2.1 - 2.2.6): con una sesion TODAVIA valida entrega un token nuevo de 1 hora.
// Una sesion ya vencida no se puede renovar: hay que volver a ingresar la contraseña.
export async function POST(req: NextRequest) {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Sesión no iniciada o expirada.' }, { status: 401 });
  }

  // Mismos datos minimos que pone authService al iniciar sesion
  const token = generateToken({ id: usuario.id, role: usuario.role });
  const payload = verifyToken(token) as { exp?: number } | null;

  const res = NextResponse.json({ ok: true, expiraEn: payload?.exp ?? null });

  // Mismas opciones que la cookie del login (app/api/auth/login/route.ts)
  res.cookies.set('token', token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}