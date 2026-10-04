// app/api/cursos/[id]/syllabus-inclusivo/route.ts
// GET  ?formato=html|pdf -> entrega la pagina accesible o el PDF etiquetado (segun permisos)
// POST                   -> el coordinador del curso lo genera de nuevo
export const runtime = 'nodejs'; // Chromium (puppeteer) no funciona en el runtime edge

import { NextRequest, NextResponse } from 'next/server';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { esFormatoInclusivo } from '@/lib/syllabusArchivos';
import { generarSyllabusInclusivo, obtenerArchivoInclusivo } from '@/controllers/syllabusInclusivoController';

type Contexto = { params: Promise<{ id: string }> };

async function leerCursoId(context: Contexto): Promise<number | null> {
  const { id } = await context.params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// La pagina solo trae estilos y fuentes; nada de scripts (defensa extra aunque el texto ya va escapado)
const CSP_PAGINA =
  "default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src data:; base-uri 'none'; form-action 'none'";

export async function GET(req: NextRequest, context: Contexto) {
  const cursoId = await leerCursoId(context);
  if (!cursoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const formato = req.nextUrl.searchParams.get('formato') ?? 'html';
  if (!esFormatoInclusivo(formato)) {
    return NextResponse.json({ error: 'Formato no soportado (use html o pdf)' }, { status: 400 });
  }

  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });

  try {
    const r = await obtenerArchivoInclusivo(cursoId, usuario, formato);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

    const cabeceras: Record<string, string> =
      formato === 'pdf'
        ? {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${cursoId}-syllabus-inclusivo.pdf"`,
          }
        : { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': CSP_PAGINA };

    return new NextResponse(new Uint8Array(r.valor), {
      status: 200,
      headers: { ...cabeceras, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  } catch (error: unknown) {
    console.error('GET syllabus-inclusivo error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: Contexto) {
  const cursoId = await leerCursoId(context);
  if (!cursoId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });

  try {
    const r = await generarSyllabusInclusivo(cursoId, usuario);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, ...r.valor }, { status: 200 });
  } catch (error: unknown) {
    console.error('POST syllabus-inclusivo error:', error);
    return NextResponse.json({ error: 'No se pudo generar el syllabus inclusivo' }, { status: 500 });
  }
}
