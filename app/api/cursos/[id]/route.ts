'use server';

import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

/* prisma singleton (dev hot reload protection) */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

/* mapCursoResponse (mantener igual) */
function mapCursoResponse(c: any) {
  const rawCursodocente = Array.isArray(c.cursodocente) ? c.cursodocente : [];
  const cursoDocentes = rawCursodocente.map((cd: any) =>
    cd.user ? { user: { id: cd.user.id, name: cd.user.name, email: cd.user.email } } : { user: { id: cd.userId, name: '', email: '' } }
  );
  const docentesSimple = cursoDocentes.map((cd: any) => cd.user);

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
    prerrequisitos: c.prerequisite_prerequisite_courseIdTocourse?.map((p: any) => ({ id: p.prerequisiteId })) ?? [],
  };
}

/**
 * GET /api/cursos/:id
 * - Devuelve el curso completo con coordinador, docentes, logros y prerrequisitos
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idStr = params.id;
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

    return NextResponse.json(mapCursoResponse(curso), { status: 200 });
  } catch (error: any) {
    console.error('❌ GET /api/cursos/[id] error:', error);
    return NextResponse.json({ error: 'Error al obtener el curso', detalle: error?.message ?? String(error) }, { status: 500 });
  }
}

/**
 * PUT /api/cursos/:id
 * - Actualiza parcial o totalmente el curso
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const idStr = params.id;
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
      docentes = [],
      logros = [],
    } = data;

    const cursoExist = await prisma.course.findUnique({ where: { id } });
    if (!cursoExist) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    if (typeof coordinadorId !== 'undefined' && coordinadorId !== null) {
      const coordExists = await prisma.user.findUnique({ where: { id: coordinadorId } });
      if (!coordExists) return NextResponse.json({ error: 'coordinadorId no existe' }, { status: 400 });
    }

    const updateData: any = {};
    if (typeof code !== 'undefined') updateData.code = code;
    if (typeof name !== 'undefined') updateData.name = name;
    if (typeof credits !== 'undefined') updateData.credits = credits;
    if (typeof type !== 'undefined') updateData.type = type;
    if (typeof area !== 'undefined') updateData.area = area;
    if (typeof weeks !== 'undefined') updateData.weeks = weeks;
    if (typeof theoryHours !== 'undefined') updateData.theoryHours = theoryHours;
    if (typeof practiceHours !== 'undefined') updateData.practiceHours = practiceHours;
    if (typeof labHours !== 'undefined') updateData.labHours = labHours;
    if (typeof semester !== 'undefined') updateData.semester = semester;
    if (typeof cycle !== 'undefined') updateData.cycle = cycle;
    if (typeof modality !== 'undefined') updateData.modality = modality;
    if (typeof group !== 'undefined') updateData.group = group;
    if (typeof sumilla !== 'undefined') updateData.sumilla = sumilla;
    if (typeof coordinadorId !== 'undefined') updateData.coordinadorId = coordinadorId;

    if (Object.keys(updateData).length > 0) {
      await prisma.course.update({ where: { id }, data: updateData });
    }

    if (Array.isArray(logros)) {
      await prisma.logro.deleteMany({ where: { cursoId: id } });
      if (logros.length > 0) {
        const createLogros = logros.map((l: any) => ({
          codigo: l.codigo,
          descripcion: l.descripcion,
          tipo: l.tipo,
          nivel: l.nivel,
          cursoId: id,
        }));
        await prisma.logro.createMany({ data: createLogros });
      }
    }

    if (Array.isArray(docentes)) {
      await prisma.cursodocente.deleteMany({ where: { courseId: id } });
      if (docentes.length > 0) {
        const createData = docentes.map((userId: number) => ({ courseId: id, userId }));
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

    return NextResponse.json({ message: '✅ Curso actualizado correctamente', curso: mapCursoResponse(cursoActualizado) }, { status: 200 });
  } catch (error: any) {
    console.error('❌ PUT /api/cursos/[id] error:', error);
    return NextResponse.json({ error: 'Error al actualizar el curso', detalle: error?.message ?? String(error) }, { status: 500 });
  }
}
