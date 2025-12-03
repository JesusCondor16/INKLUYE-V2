export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';
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

    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Relaciones necesarias para el syllabus
    const competencias = await prisma.competencia.findMany({ where: { cursoId } });
    const logros = await prisma.logro.findMany({ where: { cursoId } });
    const matriz = await prisma.matrizevaluacion.findMany({ where: { courseId: cursoId } });
    const bibliografia = await prisma.bibliografia.findMany({ where: { courseId: cursoId } });
    const estrategia = await prisma.estrategiadidactica.findMany({ where: { course: { id: cursoId } } });
    const recursos = await prisma.recurso.findMany({ where: { course: { id: cursoId } } });
    const capacidades = await prisma.capacidad.findMany({ where: { cursoId } });
    const programacion = await prisma.programacioncontenido.findMany({ where: { capacidad: { cursoId } } });
    const prerequisites = await prisma.prerequisite.findMany({ where: { courseId: cursoId } });
    const cursodocente = await prisma.cursodocente.findMany({ where: { courseId: cursoId } });

    const docenteIds = cursodocente.map(cd => cd.userId).filter((id): id is number => Boolean(id));
    const docentes = docenteIds.length
      ? await prisma.user.findMany({ where: { id: { in: docenteIds } } })
      : [];

    // -----------------------------
    // GENERACIÓN DE PDF (seguro)
    // -----------------------------
    const dir = path.join(process.cwd(), 'public', 'pdf');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename = `${cursoId}.pdf`;
    const filePath = path.join(dir, filename);

    let pdfUrl: string | null = null;
    let generated = false;

    if (!fs.existsSync(filePath)) {
      const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
      const page = await browser.newPage();

      const html = `
        <h1>${curso.name}</h1>
        <p><strong>Código:</strong> ${curso.code}</p>
        <p><strong>Créditos:</strong> ${curso.credits ?? '-'}</p>
        <h2>Sumilla</h2>
        <p>${curso.sumilla ?? '—'}</p>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // ✅ Convertimos Uint8Array a Buffer para Node.js
      const pdfUint8 = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
      });

      const pdfBuffer = Buffer.from(pdfUint8);
      fs.writeFileSync(filePath, pdfBuffer);
      await browser.close();

      pdfUrl = `/pdf/${filename}`;
      generated = true;
    } else {
      pdfUrl = `/pdf/${filename}`;
    }

    return NextResponse.json({
      curso,
      capacidades,
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
      generated,
    });
  } catch (err: unknown) {
    console.error('Error en /api/pdf route:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Error servidor', detalle: msg }, { status: 500 });
  }
}
