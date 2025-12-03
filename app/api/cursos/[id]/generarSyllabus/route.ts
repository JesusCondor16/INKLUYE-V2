// app/api/cursos/[id]/generarSyllabus/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
type Params = { id?: string };

export async function GET(_req: Request, context: { params: Params | Promise<Params> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

  const cursoId = parseInt(idStr, 10);
  if (Number.isNaN(cursoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  try {
    console.log(`[generarSyllabus] inicio para courseId=${cursoId}`);
    console.log('[generarSyllabus] Prisma keys:', Object.keys(prisma).join(', '));

    // Traer datos principales del curso
    const curso = await prisma.course.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        name: true,
        code: true,
        sumilla: true,
        credits: true,
        type: true,
        area: true,
        weeks: true,
        theoryHours: true,
        practiceHours: true,
        labHours: true,
        semester: true,
        cycle: true,
        modality: true,
        group: true,
      },
    });

    if (!curso) {
      console.warn(`[generarSyllabus] curso no encontrado: ${cursoId}`);
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });
    }

    // Relaciones y datos necesarios para el syllabus
    const competencias = await prisma.competencia.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    const logros = await prisma.logro.findMany({
      where: { cursoId },
      select: { id: true, codigo: true, descripcion: true, tipo: true, nivel: true },
      orderBy: { codigo: 'asc' },
    });

    // MATRIZ DE EVALUACION -> modelo en tu schema: matrizevaluacion
    const matriz = await prisma.matrizevaluacion.findMany({
      where: { courseId: cursoId },
      orderBy: { unidad: 'asc' },
      select: { unidad: true, criterio: true, producto: true, instrumento: true, nota_peso: true, nota_sum: true },
    });

    // BIBLIOGRAFIA
    const bibliografia = await prisma.bibliografia.findMany({
      where: { courseId: cursoId },
      orderBy: { id: 'asc' },
      select: { id: true, texto: true },
    });

    // ESTRATEGIAS DIDACTICAS -> modelo: estrategiadidactica
    const estrategia = await prisma.estrategiadidactica.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, texto: true },
    });

    // RECURSOS -> modelo: recurso
    const recursos = await prisma.recurso.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, descripcion: true },
    });

    // CAPACIDADES
    const capacidades = await prisma.capacidad.findMany({
      where: { cursoId },
      orderBy: { id: 'asc' },
      select: { id: true, nombre: true, descripcion: true, cursoId: true },
    });

    // PROGRAMACION DE CONTENIDOS -> modelo: programacioncontenido
    const programacion = await prisma.programacioncontenido.findMany({
      where: { capacidad: { cursoId } }, // filtrar por relation capacidad.cursoId
      orderBy: { semana: 'asc' },
      select: {
        id: true,
        logroUnidad: true,
        semana: true,
        contenido: true,
        actividades: true,
        recursos: true,
        estrategias: true,
        capacidadId: true,
      },
    });

    // PRERREQUISITOS
    const prerequisites = await prisma.prerequisite.findMany({
      where: { courseId: cursoId },
      select: { prerequisiteId: true },
    });

    // CURSODOCENTE -> obtener userIds (modelo: cursodocente)
    const cursodocente = await prisma.cursodocente.findMany({
      where: { courseId: cursoId },
      select: { userId: true },
    });
    const docenteIds = cursodocente.map(cd => cd.userId).filter(Boolean);

    const docentes = docenteIds.length
      ? await prisma.user.findMany({ where: { id: { in: docenteIds } }, select: { id: true, name: true, email: true } })
      : [];

    console.log(`[generarSyllabus] datos recolectados para courseId=${cursoId} — competencias:${competencias.length}, logros:${logros.length}, matriz:${matriz.length}, programacion:${programacion.length}`);

    // ---------------------------
    // GENERAR PDF (Opción A: NO sobrescribir si ya existe)
    // ---------------------------

    // Asegurar carpeta public/syllabus
    const dir = path.join(process.cwd(), 'public', 'syllabus');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Nombre de archivo estable por cursoId
    const filename = `${cursoId}.pdf`;
    const filePath = path.join(dir, filename);

    // Construir contenido simple para el caso de generar (si el archivo no existe)
    const safeCompetencias = Array.isArray(competencias) ? competencias : [];
    const safeLogros = Array.isArray(logros) ? logros : [];
    const safeMatriz = Array.isArray(matriz) ? matriz : [];
    const safeBibliografia = Array.isArray(bibliografia) ? bibliografia : [];

    // Solo generamos si el archivo NO existe. Si existe, lo dejamos tal cual (tu PDF personalizado).
    let generated = false;
    if (fs.existsSync(filePath)) {
      console.log(`[generarSyllabus] archivo existente detectado, no se sobrescribe: ${filePath}`);
    } else {
      // construir líneas para el PDF (puedes personalizar después)
      const lines: string[] = [];
      lines.push(`Curso: ${curso.name}`);
      lines.push(`Código: ${curso.code}`);
      lines.push(`Créditos: ${curso.credits ?? '-'}`);
      lines.push('');
      lines.push('Sumilla:');
      lines.push(curso.sumilla ?? '—');
      lines.push('');
      lines.push('Logros:');
      if (safeLogros.length > 0) {
        safeLogros.forEach((l: any, i: number) => lines.push(`${i + 1}. ${l.descripcion}`));
      } else lines.push('—');
      lines.push('');
      lines.push('Competencias:');
      if (safeCompetencias.length > 0) {
        safeCompetencias.forEach((c: any, i: number) => lines.push(`${i + 1}. ${c.codigo} - ${c.descripcion ?? ''}`));
      } else lines.push('—');
      lines.push('');
      lines.push('Matriz de Evaluación (resumen):');
      if (safeMatriz.length > 0) {
        safeMatriz.forEach((m: any) => lines.push(`Unidad ${m.unidad}: ${m.criterio} -> ${m.producto}`));
      } else lines.push('—');
      lines.push('');
      lines.push('Bibliografía:');
      if (safeBibliografia.length > 0) {
        safeBibliografia.forEach((b: any, i: number) => lines.push(`${i + 1}. ${b.texto}`));
      } else lines.push('—');

      // generar PDF con pdf-lib
      const pdfDoc = await PDFDocument.create();
      const pageSize = [595.28, 841.89];
      let page = pdfDoc.addPage(pageSize);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 11;
      let cursorY = page.getHeight() - 40;

      for (const line of lines) {
        if (cursorY < 40) {
          page = pdfDoc.addPage(pageSize);
          cursorY = page.getHeight() - 40;
        }
        const pages = pdfDoc.getPages();
        const current = pages[pages.length - 1];
        current.drawText(line, { x: 40, y: cursorY, size: fontSize, font });
        cursorY -= fontSize + 6;
      }

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, Buffer.from(pdfBytes));
      generated = true;
      console.log(`[generarSyllabus] PDF creado en: ${filePath}`);
    }

    // upsert en tabla syllabus (guardar pdfUrl)
    const pdfUrl = `/syllabus/${filename}`;
    const saved = await prisma.syllabus.upsert({
      where: { courseId: cursoId },
      update: { pdfUrl, updatedAt: new Date() },
      create: { courseId: cursoId, pdfUrl, createdAt: new Date(), updatedAt: new Date() },
    });

    console.log(`[generarSyllabus] PDFUrl guardado en BD: ${pdfUrl} (generado:${generated})`);

    // Respuesta (manteniendo tu payload y añadiendo url + saved para confirmación)
    return NextResponse.json(
      {
        curso,
        capacidades,
        capacidad: capacidades,
        competencias,
        logros,
        matriz,
        bibliografia,
        estrategia,
        recursos,
        programacion,
        prerequisites,
        cursodocente: docentes,
        url: pdfUrl,
        saved,
        generated,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Error en generarSyllabus route:', err);
    return NextResponse.json({ error: 'Error servidor', detalle: String(err?.message ?? err) }, { status: 500 });
  } finally {
    // no desconectamos prisma en dev
  }
}
