import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import puppeteer from "puppeteer";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const cursoId = parseInt(id, 10);
    if (isNaN(cursoId))
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    // Traer el curso con relaciones correctas según tu schema Prisma
    const course = await prisma.course.findUnique({
      where: { id: cursoId },
      include: {
        competencia: true,
        logro: true,
        capacidad: { include: { programacioncontenido: true } },
        estrategiadidactica: true, // CORRECTO según schema
        recurso: true,             // CORRECTO según schema
        bibliografia: true,
        matrizevaluacion: true,
      },
    });

    if (!course)
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    // Construir HTML simple para PDF
    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
            h1 { font-size: 18px; }
            h2 { font-size: 14px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ccc; padding: 5px; text-align: left; }
          </style>
        </head>
        <body>
          <h1>${course.name} (${course.code})</h1>
          <p><strong>Créditos:</strong> ${course.credits ?? "-"}</p>
          <h2>Sumilla</h2>
          <p>${course.sumilla ?? "—"}</p>
          <h2>Competencias</h2>
          <ul>
            ${course.competencia.map(c => `<li>${c.codigo} - ${c.descripcion}</li>`).join("")}
          </ul>
          <h2>Logros</h2>
          <ul>
            ${course.logro.map(l => `<li>${l.descripcion}</li>`).join("")}
          </ul>
          <h2>Capacidades y Programación</h2>
          ${course.capacidad
            .map(
              cap => `
              <h3>${cap.nombre}</h3>
              <p>${cap.descripcion}</p>
              <ul>
                ${cap.programacioncontenido.map(p => `<li>${p.semana}: ${p.contenido}</li>`).join("")}
              </ul>
            `
            )
            .join("")}
        </body>
      </html>
    `;

    // Generar PDF con Puppeteer
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    // PDF como Buffer
    const pdfArray = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    const pdfBuffer = Buffer.from(pdfArray); // ✅ Asegura que sea Buffer

    await browser.close();

    // Guardar PDF en filesystem (opcional)
    const fs = await import("fs");
    const path = await import("path");
    const dir = path.join(process.cwd(), "public", "syllabus");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filename = `${cursoId}.pdf`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, pdfBuffer);

    // Guardar referencia en DB
    const pdfUrl = `/syllabus/${filename}`;
    const saved = await prisma.syllabus.upsert({
      where: { courseId: cursoId },
      update: { pdfUrl, updatedAt: new Date() },
      create: { courseId: cursoId, pdfUrl, createdAt: new Date(), updatedAt: new Date() },
    });

    return NextResponse.json({
      curso: course,
      pdfUrl,
      saved,
    });
  } catch (err) {
    console.error("Error al generar PDF:", err);
    return NextResponse.json(
      { error: "Error al generar PDF", detalle: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
