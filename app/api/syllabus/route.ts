import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 📘 POST: Crea un nuevo syllabus
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { titulo, seccion1, seccion2, seccion3, seccion4 } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: "El campo 'titulo' es obligatorio." },
        { status: 400 }
      );
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        titulo,
        seccion1: seccion1 ?? {},
        seccion2: seccion2 ?? {},
        seccion3: seccion3 ?? {},
        seccion4: seccion4 ?? {},
      },
    });

    return NextResponse.json(syllabus, { status: 201 });
  } catch (error) {
    console.error("❌ Error al guardar syllabus:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
  } catch (error) {
    console.error("❌ Error al obtener syllabus:", error);
    return NextResponse.json(
      { error: "Error al obtener datos" },
      { status: 500 }
    );
  }
}
