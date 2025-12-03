// app/api/cursos/[id]/uploadSyllabus/route.ts
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma"; // Ajusta si tu prisma está en otra ruta

type Params = { id?: string };

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
    let body: any;
    try {
      body = await req.json();
    } catch (err) {
      return NextResponse.json({ success: false, error: "Payload inválido (JSON esperado)" }, { status: 400 });
    }

    const { filename, data } = body || {};
    if (!filename || !data) {
      return NextResponse.json({ success: false, error: "Campo 'filename' y 'data' (base64) son requeridos" }, { status: 400 });
    }

    // Validación básica del base64 (evitar strings obviamente incorrectos)
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

    // Upsert en la tabla syllabus (guarda pdfUrl y timestamps)
    // Nota: si tu modelo prisma tiene otro nombre o campos distintos, ajusta aquí.
    const saved = await prisma.syllabus.upsert({
      where: { courseId },
      update: { pdfUrl, updatedAt: new Date() as any },
      create: { courseId, pdfUrl, createdAt: new Date() as any, updatedAt: new Date() as any },
    });

    return NextResponse.json({ success: true, url: pdfUrl, saved }, { status: 200 });
  } catch (err: any) {
    console.error("uploadSyllabus error:", err);
    return NextResponse.json({ success: false, error: "Error del servidor", detalle: String(err?.message ?? err) }, { status: 500 });
  }
}
