import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import prisma from "@/lib/prisma";

interface CursoDocente {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Logro {
  descripcion: string;
}

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const idStr = context.params?.id;
    const id = parseInt(idStr || "", 10);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    // Obtener datos del curso (incluyendo coordinador y docentes)
    const curso = await prisma.course.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } }, // coordinador
        cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } }, // docentes
        logro: true,
      },
    });

    if (!curso) {
      return NextResponse.json({ success: false, error: "Curso no encontrado" }, { status: 404 });
    }

    // Construir contenido básico del PDF
    const lines: string[] = [];
    lines.push(`Curso: ${curso.name}`);
    lines.push(`Código: ${curso.code}`);
    lines.push(`Coordinador: ${curso.user?.name ?? "—"}`);

    const docentesList = (curso.cursodocente ?? []).map((cd: CursoDocente) => cd.user?.name ?? "-").join(", ");
    lines.push(`Docentes: ${docentesList || "—"}`);
    lines.push("");
    lines.push("Logros:");

    if (Array.isArray(curso.logro) && curso.logro.length > 0) {
      curso.logro.forEach((l: Logro, i: number) => {
        lines.push(`${i + 1}. ${l.descripcion}`);
      });
    } else {
      lines.push("—");
    }

    // Generar PDF con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.TIMES_ROMAN);
    const fontSize = 12;
    const pageSize = [595.28, 841.89]; // A4 aproximado
    let page = pdfDoc.addPage(pageSize);
    let cursorY = page.getHeight() - 40;

    const drawLine = (text: string) => {
      if (cursorY < 40) {
        page = pdfDoc.addPage(pageSize);
        cursorY = page.getHeight() - 40;
      }
      page.drawText(text, { x: 40, y: cursorY, size: fontSize, font });
      cursorY -= fontSize + 6;
    };

    for (const line of lines) {
      drawLine(line);
    }

    const pdfBytes = await pdfDoc.save();

    // Asegurarnos que public/syllabus existe
    const dir = path.join(process.cwd(), "public", "syllabus");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${id}.pdf`);
    fs.writeFileSync(filePath, Buffer.from(pdfBytes));

    // Construir la URL pública relativa
    const pdfUrl = `/syllabus/${id}.pdf`;

    // Upsert en la tabla syllabus (Prisma)
    await prisma.syllabus.upsert({
      where: { courseId: id },
      update: { pdfUrl },
      create: { courseId: id, pdfUrl },
    });

    return NextResponse.json({ success: true, message: "PDF generado y guardado", pdfUrl }, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error GET /api/syllabus/[id]:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: detail }, { status: 500 });
  }
}
