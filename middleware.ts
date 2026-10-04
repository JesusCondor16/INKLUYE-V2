// middleware.ts
// Se ejecuta en el servidor ANTES de mostrar cualquier pagina.
// Antes no existia: las paginas se abrian sin sesion y solo fallaban despues,
// cuando sus llamadas a la API respondian 401 ("Error: Usuario no autenticado").
import { NextRequest, NextResponse } from 'next/server';
import { verificarTokenEdge } from '@/lib/jwtEdge';
import { decidirAcceso } from '@/lib/accesoPaginas';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const sesion = token ? await verificarTokenEdge(token, process.env.JWT_SECRET ?? '') : null;

  const decision = decidirAcceso(req.nextUrl.pathname, sesion?.role ?? null, !!token);

  if (decision.tipo === 'permitir') return NextResponse.next();

  if (decision.tipo === 'redirigir') {
    return NextResponse.redirect(new URL(decision.destino, req.url));
  }

  // Sin sesion valida: al login. Si la cookie estaba vencida, se borra y se avisa.
  const login = new URL('/login', req.url);
  if (decision.sesionExpirada) login.searchParams.set('sesion', 'expirada');

  const res = NextResponse.redirect(login);
  if (decision.sesionExpirada) res.cookies.delete('token');
  return res;
}

export const config = {
  // Todas las paginas, excepto la API (cada ruta valida su propia sesion),
  // los archivos internos de Next y los archivos estaticos (imagenes, iconos, PDF publicos)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.[a-zA-Z0-9]+$).*)'],
};
