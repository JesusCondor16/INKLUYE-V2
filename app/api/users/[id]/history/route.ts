import { NextRequest, NextResponse } from 'next/server';
import { userHistoryController } from '@/controllers/userHistoryController';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {

  try {

    const usuario = obtenerUsuarioDesdeTokenServer(req);
    if (!usuario) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }
    if (!requiereRol(usuario, 'director')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id: idStr } = await context.params;

    const id = Number(idStr);

    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json([], { status: 200 });
    }

    const history = await userHistoryController.getHistory(id);

    return NextResponse.json(history ?? [], { status: 200 });

  } catch (error) {

    console.error("Error obteniendo historial:", error);

    return NextResponse.json([], { status: 200 });

  }

}