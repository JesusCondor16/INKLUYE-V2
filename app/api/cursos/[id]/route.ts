'use server';

import { NextResponse } from 'next/server';
import { PrismaClient, course, cursodocente, logro, user, prerequisite } from '@prisma/client';

/* prisma singleton (dev hot reload protection) */
declare global {
  var prisma: PrismaClient | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

/* Interfaces para tipar correctamente */
interface CursoDocenteWithUser extends cursodocente {
  user: Pick<user, 'id' | 'name' | 'email'> | null;
}

interface CursoFull extends course {
  user: Pick<user, 'id' | 'name' | 'email'> | null;
  cursodocente: CursoDocenteWithUser[];
  logro: logro[];
  prerequisite_prerequisite_courseIdTocourse: prerequisite[];
}

interface LogroInput {
  codigo?: string;
  descripcion?: string;
  tipo?: string;
  nivel?: string;
}

/* mapCursoResponse con tipado fuerte */
function mapCursoResponse(c: CursoFull) {
  const cursoDocentes = c.cursodocente.map(cd => ({
    user: cd.user ? { id: cd.user.id, name: cd.user.name, email: cd.user.email } : { id: cd.userId, name: '', email: '' },
  }));
  const docentesSimple = cursoDocentes.map(cd => cd.user);

  return {
    id: c.id,
    code: c.code,
    name: c.name,
    credits: c.credits,
    type: c.type,
    area: c.area,
    weeks: c.weeks,
    theoryHours: c.theoryHours,
    practiceHours: c.practiceHours,
    labHours: c.labHours,
    semester: c.semester,
    cycle: c.cycle,
    modality: c.modality,
    group: c.group,
    sumilla: c.sumilla,
    coordinador: c.user ?? null,
    cursoDocentes,
    docentes: docentesSimple,
    logros: c.logro ?? [],
    prerrequisitos: c.prerequisite_prerequisite_courseIdTocourse?.map(p => ({ id: p.prerequisiteId })) ?? [],
  };
}

/**
 * GET /api/cursos/:id
 */
export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    if (!idStr) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const id = parseInt(idStr, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const curso = await prisma.course.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } },
        logro: true,
        prerequisite_prerequisite_courseIdTocourse: true,
      },
    });

    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    return NextResponse.json(mapCursoResponse(curso as CursoFull), { status: 200 });
  } catch (error: unknown) {
    console.error('❌ GET /api/cursos/[id] error:', error);
    return NextResponse.json({ error: 'Error al obtener el curso', detalle: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/**
 * PUT /api/cursos/:id
 */
export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await context.params;
    if (!idStr) return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });

    const id = parseInt(idStr, 10);
    if (isNaN(id)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    const data = await req.json();
    const {
      code,
      name,
      credits,
      type,
      area,
      weeks,
      theoryHours,
      practiceHours,
      labHours,
      semester,
      cycle,
      modality,
      group,
      sumilla,
      coordinadorId,
      docentes = [] as number[],
      logros = [] as LogroInput[],
    } = data;

    const cursoExist = await prisma.course.findUnique({ where: { id } });
    if (!cursoExist) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    if (coordinadorId !== undefined && coordinadorId !== null) {
      const coordExists = await prisma.user.findUnique({ where: { id: coordinadorId } });
      if (!coordExists) return NextResponse.json({ error: 'coordinadorId no existe' }, { status: 400 });
    }

    const updateData: Partial<course> & { coordinadorId?: number } = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (credits !== undefined) updateData.credits = credits;
    if (type !== undefined) updateData.type = type;
    if (area !== undefined) updateData.area = area;
    if (weeks !== undefined) updateData.weeks = weeks;
    if (theoryHours !== undefined) updateData.theoryHours = theoryHours;
    if (practiceHours !== undefined) updateData.practiceHours = practiceHours;
    if (labHours !== undefined) updateData.labHours = labHours;
    if (semester !== undefined) updateData.semester = semester;
    if (cycle !== undefined) updateData.cycle = cycle;
    if (modality !== undefined) updateData.modality = modality;
    if (group !== undefined) updateData.group = group;
    if (sumilla !== undefined) updateData.sumilla = sumilla;
    if (coordinadorId !== undefined) updateData.coordinadorId = coordinadorId;

    if (Object.keys(updateData).length > 0) {
      await prisma.course.update({ where: { id }, data: updateData });
    }

    // Logros
    if (Array.isArray(logros)) {
      await prisma.logro.deleteMany({ where: { cursoId: id } });
      if (logros.length > 0) {
        const createLogros = logros.map(l => ({
          codigo: l.codigo ?? '',
          descripcion: l.descripcion ?? '',
          tipo: l.tipo ?? '',
          nivel: l.nivel ?? '',
          cursoId: id,
        }));
        await prisma.logro.createMany({ data: createLogros });
      }
    }

    // Docentes
    if (Array.isArray(docentes)) {
      await prisma.cursodocente.deleteMany({ where: { courseId: id } });
      if (docentes.length > 0) {
        const createData = docentes.map(userId => ({ courseId: id, userId }));
        await prisma.cursodocente.createMany({ data: createData });
      }
    }

    const cursoActualizado = await prisma.course.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        cursodocente: { include: { user: { select: { id: true, name: true, email: true } } } },
        logro: true,
        prerequisite_prerequisite_courseIdTocourse: true,
      },
    });

    return NextResponse.json(
      { message: '✅ Curso actualizado correctamente', curso: mapCursoResponse(cursoActualizado as CursoFull) },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('❌ PUT /api/cursos/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar el curso', detalle: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
