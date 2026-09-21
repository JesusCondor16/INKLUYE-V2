// src/models/cursoModel.ts
import prisma from "@/lib/prisma";

export const cursoModel = {

  async findAll() {
    try {
      return await prisma.course.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } }, // coordinador
          cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } }, // docentes
          syllabus: true, // <-- muy importante: trae pdfUrl
        },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      console.error("❌ cursoModel.findAll error:", error);
      return [];
    }
  },
};

export default cursoModel;