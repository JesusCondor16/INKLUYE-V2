// src/models/cursoModel.ts
import prisma from "@/lib/prisma";

/**
 * cursoModel
 * Métodos robustos para obtener cursos y sus relaciones relevantes
 * (coordinador, docentes, syllabus, logros, capacidades, programación, etc.)
 *
 * Este archivo asume que tu schema Prisma usa los modelos con nombres en minúscula
 * (ej. course, cursodocente, syllabus, logro, capacidad, programacioncontenido, etc.)
 */

export const cursoModel = {
  /**
   * Obtener todos los cursos con coordinador, docentes y syllabus (lista principal)
   * Esto es usado por /api/cursos/buscar — importante que incluya `syllabus`.
   */
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

  /**
   * Obtener curso por ID con coordinador, docentes, logros, syllabus y otras relaciones útiles
   * (para generar el PDF o mostrar detalles de curso)
   */
  async findById(id: number) {
    if (!id || typeof id !== "number") return null;
    try {
      return await prisma.course.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true } }, // coordinador
          cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } }, // docentes
          logro: true,
          syllabus: true,
          estrategiadidactica: true,
          recurso: true,
          matrizevaluacion: true,
          bibliografia: true,
          capacidad: { include: { programacioncontenido: true } }, // capacidades + programación
        },
      });
    } catch (error) {
      console.error(`❌ cursoModel.findById(${id}) error:`, error);
      return null;
    }
  },

  /**
   * Buscar cursos por coordinador (por coordinadorId) o fallback a cursodocente
   */
  async findByCoordinatorId(coordinatorId: number) {
    if (!coordinatorId || typeof coordinatorId !== "number") return [];

    try {
      const byCoordinadorId = await prisma.course.findMany({
        where: { coordinadorId },
        include: {
          user: { select: { id: true, name: true } },
          cursodocente: { include: { user: { select: { id: true, name: true } } } },
          syllabus: true,
        },
        orderBy: { name: "asc" },
      });
      if (byCoordinadorId.length > 0) return byCoordinadorId;

      // fallback: buscar cursos donde el usuario es docente (tabla cursodocente)
      const cursoIds = await prisma.cursodocente.findMany({
        where: { userId: coordinatorId },
        select: { courseId: true },
      });

      if (cursoIds.length > 0) {
        const ids = cursoIds.map((c) => c.courseId);
        const cursos = await prisma.course.findMany({
          where: { id: { in: ids } },
          include: {
            user: { select: { id: true, name: true } },
            cursodocente: { include: { user: { select: { id: true, name: true } } } },
            syllabus: true,
          },
          orderBy: { name: "asc" },
        });
        if (cursos.length > 0) return cursos;
      }

      return [];
    } catch (error) {
      console.error("❌ cursoModel.findByCoordinatorId error:", error);
      return [];
    }
  },

  /**
   * Crear curso (simplificado). Mantiene relación cursodocente si se envía `docentes` array.
   */
  async create(data: any) {
    try {
      return await prisma.course.create({
        data: {
          code: data.code,
          name: data.name,
          credits: data.credits,
          type: data.type,
          area: data.area || null,
          weeks: data.weeks || null,
          theoryHours: data.theoryHours || null,
          practiceHours: data.practiceHours || null,
          labHours: data.labHours || null,
          semester: data.semester || null,
          cycle: data.cycle || null,
          modality: data.modality || null,
          group: data.group || null,
          sumilla: data.sumilla || null,
          coordinadorId: data.coordinadorId || null,
          // nested create para relacion cursodocente (si vienen docentes)
          cursodocente: data.docentes
            ? { create: data.docentes.map((id: number) => ({ userId: id })) }
            : undefined,
        },
        include: {
          user: { select: { id: true, name: true } },
          cursodocente: { include: { user: { select: { id: true, name: true } } } },
          syllabus: true,
        },
      });
    } catch (error) {
      console.error("❌ cursoModel.create error:", error);
      throw error;
    }
  },

  /**
   * Actualizar curso (simplificado) y reemplazar docentes si vienen
   */
  async update(id: number, data: any) {
    if (!id || typeof id !== "number") throw new Error("ID inválido");

    const updateData: any = {
      code: data.code,
      name: data.name,
      credits: data.credits,
      type: data.type,
      area: data.area ?? null,
      weeks: data.weeks ?? null,
      theoryHours: data.theoryHours ?? null,
      practiceHours: data.practiceHours ?? null,
      labHours: data.labHours ?? null,
      semester: data.semester ?? null,
      cycle: data.cycle ?? null,
      modality: data.modality ?? null,
      group: data.group ?? null,
      sumilla: data.sumilla ?? null,
      coordinadorId: data.coordinadorId ?? null,
    };

    try {
      await prisma.course.update({ where: { id }, data: updateData });

      if (Array.isArray(data.docentes)) {
        // eliminar relaciones antiguas y recrear (alternativa: upsert con diferencia)
        await prisma.cursodocente.deleteMany({ where: { courseId: id } });
        if (data.docentes.length > 0) {
          // createMany con skipDuplicates para evitar errores si ya existen combos
          await prisma.cursodocente.createMany({
            data: data.docentes.map((userId: number) => ({ courseId: id, userId })),
            skipDuplicates: true,
          });
        }
      }

      return await this.findById(id);
    } catch (error) {
      console.error(`❌ cursoModel.update(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Eliminar curso (y relaciones dependientes según convenga)
   */
  async delete(id: number) {
    if (!id || typeof id !== "number") throw new Error("ID inválido");
    try {
      // eliminar relaciones dependientes (ajusta según tu política)
      await prisma.cursodocente.deleteMany({ where: { courseId: id } });
      await prisma.syllabus.deleteMany({ where: { courseId: id } });
      // eliminar curso
      return await prisma.course.delete({ where: { id } });
    } catch (error) {
      console.error(`❌ cursoModel.delete(${id}) error:`, error);
      throw error;
    }
  },

  /**
   * Obtener curso con prerrequisitos (ejemplo)
   */
  async findByIdWithPrerequisites(id: number) {
    if (!id || typeof id !== "number") return null;
    try {
      return await prisma.course.findUnique({
        where: { id },
        include: {
          prerequisite_prerequisite_courseIdTocourse: {
            select: {
              prerequisiteId: true,
              course_prerequisite_prerequisiteIdTocourse: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error(`❌ cursoModel.findByIdWithPrerequisites(${id}) error:`, error);
      return null;
    }
  },
};

export default cursoModel;
