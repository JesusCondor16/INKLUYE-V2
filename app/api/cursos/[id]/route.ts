'use server';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { userModel } from '@/models/userModel';
import { obtenerUsuarioDesdeTokenServer, esCoordinadorDelCurso } from '@/lib/authServer';

function mapCursoResponse(c: any) {

  const coordinador =
    c.user?.role === 'coordinador'
      ? {
          id: c.user.id,
          name: c.user.name,
          email: c.user.email,
          role: c.user.role
        }
      : null;

  const cursoDocentes =
    (c.cursodocente ?? [])
      .filter((cd: any) => cd.user?.role === 'docente')
      .map((cd: any) => ({
        user: {
          id: cd.user.id,
          name: cd.user.name,
          email: cd.user.email,
          role: cd.user.role
        }
      }));

  const docentesSimple =
    (c.cursodocente ?? [])
      .map((cd: any) => cd.user)
      .filter(Boolean);

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

    prerequisites:
      (c.prerequisite_prerequisite_courseIdTocourse ?? [])
        .map((p: any) => ({
          prerequisite: {
            name:
              p.course_prerequisite_prerequisiteIdTocourse?.name ?? ''
          }
        }))
  };
}

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {

  try {

    const { id: idStr } = await context.params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const curso =
      await prisma.course.findUnique({

        where: { id },

        include: {

          user: true,

          cursodocente: {
            include: {
              user: true
            }
          },

          logro: true,

          prerequisite_prerequisite_courseIdTocourse: {
            include: {
              course_prerequisite_prerequisiteIdTocourse: true
            }
          }

        }

      });

    if (!curso) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      mapCursoResponse(curso),
      { status: 200 }
    );

  }

  catch (error: unknown) {

    console.error(
      '❌ GET /api/cursos/[id] error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Error al obtener el curso'
      },
      { status: 500 }
    );
  }
}


/* ===========================
   PUT - ACTUALIZAR CURSO
=========================== */

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  try {

    const { id: idStr } = await context.params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      );
    }

    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }
    if (!(await esCoordinadorDelCurso(usuario, id))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await req.json();

    const {
      cycle,
      coordinadorId,
      docentes
    } = body;

    if (coordinadorId != null) {
      const nuevoCoordinador = await userModel.findById(coordinadorId);
      if (!nuevoCoordinador || nuevoCoordinador.role !== 'coordinador') {
        return NextResponse.json(
          { error: 'coordinadorId inválido: el usuario no existe o no tiene rol coordinador' },
          { status: 400 }
        );
      }
    }

    // actualizar curso
    await prisma.course.update({

      where: { id },

      data: {
        cycle: cycle ?? null,

        user: coordinadorId
          ? { connect: { id: coordinadorId } }
          : { disconnect: true }
      }

    });

    // actualizar docentes
    if (Array.isArray(docentes)) {

      await prisma.cursodocente.deleteMany({
        where: { courseId: id }
      });

      if (docentes.length > 0) {

        await prisma.cursodocente.createMany({

          data: docentes.map((docenteId: number) => ({
            courseId: id,
            userId: docenteId
          }))

        });

      }

    }

    // devolver curso actualizado
    const cursoActualizado =
      await prisma.course.findUnique({

        where: { id },

        include: {

          user: true,

          cursodocente: {
            include: {
              user: true
            }
          },

          logro: true,

          prerequisite_prerequisite_courseIdTocourse: {
            include: {
              course_prerequisite_prerequisiteIdTocourse: true
            }
          }

        }

      });

    return NextResponse.json(
      {
        message: 'Curso actualizado correctamente',
        curso: mapCursoResponse(cursoActualizado)
      },
      { status: 200 }
    );

  }

  catch (error: unknown) {
    console.error(
      '❌ PUT /api/cursos/[id] error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Error al actualizar curso'
      },
      { status: 500 }
    );
  }
}