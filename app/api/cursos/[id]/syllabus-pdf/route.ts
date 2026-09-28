// app/api/cursos/[id]/syllabus-pdf/route.ts
// Entrega el PDF del syllabus solo si el usuario tiene permiso segun el estado.
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { obtenerUsuarioDesdeTokenServer } from '@/lib/authServer';
import { puedeVerSyllabus } from '@/lib/syllabusPermisos';
import { esIdiomaSyllabus, rutaArchivoSyllabus } from '@/lib/syllabusArchivos';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) {
    return NextResponse.json({ error: 'ID invalido' }, { status: 400 });
  }

  const lang = req.nextUrl.searchParams.get('lang') ?? 'es';
  if (!esIdiomaSyllabus(lang)) {
    return NextResponse.json({ error: 'Idioma no soportado' }, { status: 400 });
  }

  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }

  try {
    const curso = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        coordinadorId: true,
        syllabus: { select: { estado: true } },
        cursodocente: { where: { userId: usuario.id }, select: { userId: true } },
      },
    });

    if (!curso?.syllabus) {
      return NextResponse.json({ error: 'Syllabus no encontrado' }, { status: 404 });
    }

    const permitido = puedeVerSyllabus({
      rol: usuario.role,
      estado: curso.syllabus.estado,
      esCoordinadorDelCurso: curso.coordinadorId === usuario.id,
      esDocenteDelCurso: curso.cursodocente.length > 0,
    });
    if (!permitido) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    let archivo: Buffer;
    try {
      archivo = await fs.readFile(rutaArchivoSyllabus(courseId, lang));
    } catch {
      return NextResponse.json({ error: 'PDF no encontrado para este idioma' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(archivo), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${courseId}-${lang}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: unknown) {
    console.error('syllabus-pdf error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
