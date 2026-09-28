// app/api/cursos/[id]/uploadSyllabus/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import prisma from "@/lib/prisma";
import { obtenerUsuarioDesdeTokenServer, esCoordinadorDelCurso } from "@/lib/authServer";
import { CARPETA_SYLLABUS, idiomaDesdeNombreArchivo, rutaArchivoSyllabus, urlSyllabus } from "@/lib/syllabusArchivos";

type Params = { id?: string };

interface UploadSyllabusBody {
  filename: string;
  data: string; // base64
}

export async function POST(req: NextRequest, context: { params: Params | Promise<Params> }) {
  try {
    const { id: idStr } = await context.params;
    if (!idStr) {
      return NextResponse.json({ success: false, error: "ID no proporcionado" }, { status: 400 });
    }

    const courseId = parseInt(idStr, 10);
    if (Number.isNaN(courseId)) {
      return NextResponse.json({ success: false, error: "ID inválido" }, { status: 400 });
    }

    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ success: false, error: "Usuario no autenticado" }, { status: 401 });
    }
    if (!(await esCoordinadorDelCurso(usuario, courseId))) {
      return NextResponse.json({ success: false, error: "No autorizado" }, { status: 403 });
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

    // El nombre debe ser exactamente "<courseId>-<es|en|zh>.pdf" (evita path traversal y nombres arbitrarios)
    const lang = idiomaDesdeNombreArchivo(courseId, filename);
    if (!lang) {
      return NextResponse.json({ success: false, error: "Nombre de archivo inválido" }, { status: 400 });
    }

    // Validación básica del base64
    if (typeof data !== "string" || !/^([A-Za-z0-9+/=]+\s*)+$/.test(data.trim())) {
      return NextResponse.json({ success: false, error: "Campo 'data' no parece ser base64 válido" }, { status: 400 });
    }

    // Decodificar base64
    const buffer = Buffer.from(data, "base64");

    // Carpeta privada (fuera de public/): solo se descarga via /api/cursos/[id]/syllabus-pdf
    await fs.mkdir(CARPETA_SYLLABUS, { recursive: true });
    await fs.writeFile(rutaArchivoSyllabus(courseId, lang), buffer);

    const pdfUrl = urlSyllabus(courseId, lang);

    // Regenerar siempre devuelve el syllabus a BORRADOR y queda registrado en el historial
    const now = new Date();
    const saved = await prisma.$transaction(async (tx) => {
      const syllabus = await tx.syllabus.upsert({
        where: { courseId },
        update: { pdfUrl, estado: "BORRADOR", updatedAt: now },
        create: { courseId, pdfUrl, estado: "BORRADOR", createdAt: now, updatedAt: now },
      });
      await tx.syllabushistorial.create({
        data: { syllabusId: syllabus.id, accion: "GENERADO", usuarioId: usuario.id },
      });
      return syllabus;
    });

    return NextResponse.json({ success: true, url: pdfUrl, saved }, { status: 200 });
  } catch (error: unknown) {
    console.error("uploadSyllabus error:", error);
    return NextResponse.json({ success: false, error: "Error del servidor" }, { status: 500 });
  }
}
