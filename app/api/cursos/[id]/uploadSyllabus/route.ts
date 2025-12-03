// app/api/cursos/[id]/uploadSyllabus/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma"; // Ajusta si tu prisma está en otra ruta

type Params = { id?: string };

interface UploadSyllabusBody {
  filename: string;
  data: string; // base64
}

export async function POST(req: Request, context: { params: Params | Promise<Params> }) {
  try {
    const { id: idStr } = await context.params;
    if (!idStr) {
      return NextResponse.json({ success: false, error: "ID no proporcionado" }, { status: 400 });
    }

    const courseId = parseInt(idStr, 10);
    if (Number.isNaN(courseId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    // leer body
    let body: UploadSyllabusBody;
    try {
      body = (await req.json()) as UploadSyllabusBody;
    } catch {
      return NextResponse.json({ success: false, error: "Payload inválido (JSON esperado)" }, { status: 400 });
    }

    const { filename, data } = body;
    if (!filename || !data) {
      return NextResponse.json({ success: false, error: "Campo 'filename' y 'data' (base64) son requeridos" }, { status: 400 });
    }

    // Validación básica del base64
    if (typeof data !== "string" || !/^([A-Za-z0-9+/=]+\s*)+$/.test(data.trim())) {
      return NextResponse.json({ success: false, error: "Campo 'data' no parece ser base64 válido" }, { status: 400 });
    }

    // Decodificar base64
    const buffer = Buffer.from(data, "base64");

    // Carpeta pública destino
    const dir = path.join(process.cwd(), "public", "syllabus");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Evitar path traversal en filename
    const safeFilename = path.basename(filename);
    const filePath = path.join(dir, safeFilename);

    // Escribir archivo (sobrescribe si ya existe)
    fs.writeFileSync(filePath, buffer);

    // Construir URL pública (relativa)
    const pdfUrl = `/syllabus/${safeFilename}`;

    // Upsert en la tabla syllabus (guardar pdfUrl y timestamps)
    const now = new Date();
    const saved = await prisma.syllabus.upsert({
      where: { courseId },
      update: { pdfUrl, updatedAt: now },
      create: { courseId, pdfUrl, createdAt: now, updatedAt: now },
    });

    return NextResponse.json({ success: true, url: pdfUrl, saved }, { status: 200 });
  } catch (error: unknown) {
    console.error("uploadSyllabus error:", error);
    const detalle = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: "Error del servidor", detalle }, { status: 500 });
  }
}
