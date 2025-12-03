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
    // Traer datos del curso
    const curso = await prisma.course.findUnique({
      where: { id: cursoId },
      select: {
        id: true,
        name: true,
        code: true,
        sumilla: true,
        credits: true,
      },
    });
    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    // Datos relacionados
    const competencias = await prisma.competencia.findMany({ where: { cursoId } });
    const logros = await prisma.logro.findMany({ where: { cursoId } });

    // -----------------------------
    // GENERAR PDF
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
        <h2>Logros</h2>
        <ul>${logros.map(l => `<li>${l.descripcion}</li>`).join('')}</ul>
        <h2>Competencias</h2>
        <ul>${competencias.map(c => `<li>${c.codigo} - ${c.descripcion}</li>`).join('')}</ul>
      `;

      await page.setContent(html, { waitUntil: 'networkidle0' });

      // ⚡ Corrección clave: usar Buffer.from()
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
      competencias,
      logros,
      url: pdfUrl,
      generated,
    });
  } catch (err: unknown) {
    console.error('Error en /api/pdf route:', err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Error servidor', detalle: msg }, { status: 500 });
  }
}
