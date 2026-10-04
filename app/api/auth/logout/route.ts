// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

// Cierra la sesion borrando la cookie httpOnly del token.
// Antes "Cerrar sesion" solo borraba localStorage y la cookie seguia valida en el servidor.
export async function POST() {
  const res = NextResponse.json({ ok: true, message: 'Sesión cerrada' });

  res.cookies.set('token', '', {
    httpOnly: true,
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });

  return res;
}
