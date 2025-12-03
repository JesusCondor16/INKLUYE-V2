// app/api/coordinador/[id]/generarSyllabus/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Course, CursoDocente, Competencia, Capacidad } from "@prisma/client";
import fs from "fs";
import path from "path";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const prisma = new PrismaClient();

// Tipos parciales para lo que necesitamos en el PDF
type CursoConRelaciones = Course & {
  cursodocente?: (CursoDocente & { user?: { name: string } })[];
  competencia?: Competencia[];
  capacidad?: Capacidad[];
};

// Tipado mínimo para lastAutoTable de jsPDF
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

// Función para generar PDF local en public/syllabus
async function generarPDF(curso: CursoConRelaciones): Promise<string> {
  const doc = new jsPDF();

  // Título
  doc.setFontSize(16);
  doc.text(curso.name, 14, 20);

  // Información general
  doc.setFontSize(12);
  doc.text(`Código: ${curso.code}`, 14, 30);
  doc.text(`Tipo: ${curso.type}`, 14, 36);
  doc.text(`Ciclo: ${curso.cycle}`, 14, 42);
  doc.text(`Créditos: ${curso.credits}`, 14, 48);

  // Docentes
  const docentes = (curso.cursodocente || [])
    .map((cd) => cd.user?.name)
    .filter(Boolean)
    .join(", ");
  doc.text(`Docentes: ${docentes || "—"}`, 14, 54);

  let yOffset = 64;

  // Competencias
  if (curso.competencia && curso.competencia.length > 0) {
    doc.setFontSize(14);
    doc.text("Competencias", 14, yOffset);
    yOffset += 6;

    const compData = curso.competencia.map((c) => [c.codigo, c.descripcion || ""]);
    autoTable(doc, {
      head: [["Código", "Descripción"]],
      body: compData,
      startY: yOffset,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    });

    yOffset = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? yOffset) + 10;
  }

  // Capacidades
  if (curso.capacidad && curso.capacidad.length > 0) {
    doc.setFontSize(14);
    doc.text("Capacidades", 14, yOffset);
    yOffset += 6;

    const capData = curso.capacidad.map((c) => [c.nombre, c.descripcion || ""]);
    autoTable(doc, {
      head: [["Nombre", "Descripción"]],
      body: capData,
      startY: yOffset,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [39, 174, 96], textColor: 255 },
    });

    yOffset = ((doc as JsPDFWithAutoTable).lastAutoTable?.finalY ?? yOffset) + 10;
  }

  // Guardar en carpeta public/syllabus
  const dir = path.join(process.cwd(), "public", "syllabus");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${curso.id}.pdf`);
  doc.save(filePath);

  // Retornar ruta pública
  return `/syllabus/${curso.id}.pdf`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id);
    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: "ID de curso inválido" },
        { status: 400 }
      );
    }

    // Traer curso con relaciones necesarias
    const curso = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        syllabus: true,
        capacidad: true,
        competencia: true,
        cursodocente: { include: { user: true } },
      },
    });

    if (!curso) {
      return NextResponse.json(
        { success: false, error: "Curso no encontrado" },
        { status: 404 }
      );
    }

    // Generar PDF local y obtener ruta pública
    const pdfUrl = await generarPDF(curso as CursoConRelaciones);

    // Guardar o actualizar en BD
    await prisma.syllabus.upsert({
      where: { courseId: curso.id },
      update: { pdfUrl, updatedAt: new Date() },
      create: { courseId: curso.id, pdfUrl },
    });

    return NextResponse.json({ success: true, pdfUrl });
  } catch (err: unknown) {
    console.error("❌ Error POST /api/coordinador/[id]/generarSyllabus:", err);

    const message = err instanceof Error ? err.message : "Error desconocido";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
