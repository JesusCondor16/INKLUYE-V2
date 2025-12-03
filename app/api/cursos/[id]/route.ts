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
  user: Pick<user, 'id' | 'name' | 'email' | 'role'> | null;
}

interface CursoFull extends course {
  user: Pick<user, 'id' | 'name' | 'email' | 'role'> | null;
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

/* mapCursoResponse con tipado fuerte y filtrado de roles */
function mapCursoResponse(c: CursoFull) {
  // Solo docentes con role 'docente'
  const cursoDocentes = c.cursodocente
    .filter(cd => cd.user?.role === 'docente')
    .map(cd => ({
      user: cd.user ? { id: cd.user.id, name: cd.user.name, email: cd.user.email } : { id: cd.userId, name: '', email: '' },
    }));

  const docentesSimple = cursoDocentes.map(cd => cd.user);

  // Solo coordinador con role 'coordinador'
  const coordinador = c.user?.role === 'coordinador' ? { id: c.user.id, name: c.user.name, email: c.user.email } : null;

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
    coordinador,
    cursoDocentes,
    docentes: docentesSimple,
    logros: c.logro ?? [],
    prerrequisitos: c.prerequisite_prerequisite_courseIdTocourse?.map(p => ({
      id: p.prerequisiteId,
      name: p.course_prerequisite_prerequisiteIdTocourse?.name ?? '',
      code: p.course_prerequisite_prerequisiteIdTocourse?.code ?? '',
    })) ?? [],
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
        user: { select: { id: true, name: true, email: true, role: true } },
        cursodocente: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        logro: true,
        prerequisite_prerequisite_courseIdTocourse: {
          include: {
            course_prerequisite_prerequisiteIdTocourse: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    if (!curso) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 });

    return NextResponse.json(mapCursoResponse(curso as CursoFull), { status: 200 });
  } catch (error: unknown) {
    console.error('❌ GET /api/cursos/[id] error:', error);
    return NextResponse.json({ error: 'Error al obtener el curso', detalle: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
