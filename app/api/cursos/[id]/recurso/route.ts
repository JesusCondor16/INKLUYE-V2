// app/api/cursos/[id]/recurso/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: obtener estrategia didáctica, recursos, bibliografía y matriz de evaluación
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cursoId = parseInt(params.id, 10);
    if (isNaN(cursoId)) {
      return NextResponse.json({ error: 'ID de curso inválido' }, { status: 400 });
    }

    // Estrategia didáctica
    const estrategiaDidactica = await prisma.estrategiaDidactica.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
    });

    // Recursos
    const recursos = await prisma.recurso.findMany({
      where: { cursoId },
      orderBy: { createdAt: 'asc' },
    });

    // Bibliografía - GET
    const bibliografia = await prisma.bibliografia.findMany({
      where: { courseId: cursoId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        texto: true, // hasta 1000 caracteres según tu schema
      },
    });

    // Matriz de evaluación
    const matrizevaluacion = await prisma.matrizevaluacion.findMany({
      where: { courseId: cursoId },
      orderBy: { unidad: 'asc' },
      select: {
        unidad: true,
        criterio: true,
        producto: true,
        instrumento: true,
        nota_peso: true,
        nota_sum: true,
      },
    });

    // Calcular nota final
    const notaFinal = matrizevaluacion.reduce((acc, fila) => {
      const nota = parseFloat(fila.nota_sum?.replace(/[^\d.]/g, '') || '0');
      const peso = fila.nota_peso || 0;
      return acc + (nota * peso) / 100;
    }, 0);

    return NextResponse.json({
      estrategiaDidactica,
      recursos,
      bibliografia,
      matrizevaluacion,
      notaFinal,
    });
  } catch (error: any) {
    console.error('Error GET curso:', error);
    return NextResponse.json({ error: 'Error al obtener los datos', detalle: error.message }, { status: 500 });
  }
}

// PUT: actualizar la bibliografía del curso
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = parseInt(params.id, 10);
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'ID de curso inválido' }, { status: 400 });
    }

    const { bibliografia } = await req.json();
    if (!Array.isArray(bibliografia)) {
      return NextResponse.json({ error: 'bibliografia debe ser un array' }, { status: 400 });
    }

    // Validar longitud de texto antes de guardar
    for (const b of bibliografia) {
      if (typeof b.texto !== 'string' || b.texto.length > 1000) {
        return NextResponse.json({
          error: 'Cada texto de bibliografía debe ser string y máximo 1000 caracteres',
        }, { status: 400 });
      }
    }

    // Borrar registros anteriores
    await prisma.bibliografia.deleteMany({ where: { courseId } });

    // Crear nuevos registros
    if (bibliografia.length > 0) {
      const data = bibliografia.map((b: any) => ({
        courseId,
        texto: b.texto,
      }));
      await prisma.bibliografia.createMany({ data });
    }

    return NextResponse.json({ message: 'Bibliografía actualizada correctamente' });
  } catch (error: any) {
    console.error('Error PUT bibliografía:', error);
    return NextResponse.json({ error: 'Error al actualizar bibliografía', detalle: error.message }, { status: 500 });
  }
}
