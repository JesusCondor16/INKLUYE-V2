import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 📘 POST: Crea un nuevo syllabus
 *
 * Body expected:
 * {
 *   "courseId": 123,        // obligatorio
 *   "pdfUrl": "/syllabus/123.pdf" // opcional
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { courseId, pdfUrl } = body;

    if (typeof courseId !== "number" || isNaN(courseId)) {
      return NextResponse.json(
        { error: "El campo 'courseId' es obligatorio y debe ser un número." },
        { status: 400 }
      );
    }

    // Verificamos si ya existe un syllabus para ese courseId (por la constraint unique)
    const existing = await prisma.syllabus.findUnique({
      where: { courseId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un syllabus para este courseId.", syllabus: existing },
        { status: 409 }
      );
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        courseId,
        pdfUrl: typeof pdfUrl === "string" ? pdfUrl : "",
      },
    });

    return NextResponse.json(syllabus, { status: 201 });
  } catch (error: unknown) {
    console.error("❌ Error al guardar syllabus:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error interno del servidor", detail },
      { status: 500 }
    );
  } finally {
    // Opcional: cerrar cliente Prisma en rutas serverless ayuda a evitar warnings en algunos entornos
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
  }
}

/**
 * 📘 GET: Obtiene todos los syllabus
 */
export async function GET() {
  try {
    const syllabus = await prisma.syllabus.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json(syllabus, { status: 200 });
  } catch (error: unknown) {
    console.error("❌ Error al obtener syllabus:", error);
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Error al obtener datos", detail },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      /* ignore */
    }
  }
}
