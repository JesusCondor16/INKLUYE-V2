// app/api/cursos/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

// Solo estos campos del usuario salen al cliente.
// Antes se usaba `user: true`, que mandaba TODA la fila (incluido el hash de la contraseña)
const camposPublicosUsuario = { id: true, name: true, email: true, role: true } as const;

export async function GET(req: NextRequest) {
  // Antes esta ruta respondia sin sesion: cualquiera podia listar los cursos con sus usuarios
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ success: false, error: 'Usuario no autenticado' }, { status: 401 });
  }
  // La unica pantalla que la usa es /director/cursos
  if (!requiereRol(usuario, 'director')) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }

  try {
    // Director: traer todos los cursos con sus docentes y coordinador
    const cursos = await prisma.course.findMany({
      include: {
        cursodocente: { include: { user: { select: camposPublicosUsuario } } }, // docentes asignados
        user: { select: camposPublicosUsuario }, // coordinador asignado
      },
    });

    return NextResponse.json({ success: true, data: cursos });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener cursos'
      },
      { status: 500 }
    );
  }
}
