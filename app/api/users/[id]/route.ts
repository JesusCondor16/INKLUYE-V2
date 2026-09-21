import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

type Context = { params: Promise<{ id: string }> };

async function parseId(paramsPromise: Promise<{ id: string }>) {
  const { id } = await paramsPromise;
  const numId = Number(id);

  if (!Number.isFinite(numId) || numId <= 0) {
    throw new Error('ID inválido');
  }

  return numId;
}

function verificarDirector(req: NextRequest): NextResponse | null {
  const usuario = obtenerUsuarioDesdeTokenServer(req);
  if (!usuario) {
    return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
  }
  if (!requiereRol(usuario, 'director')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }
  return null;
}

// GET
export async function GET(_req: NextRequest, context: Context) {
  try {

    const id = await parseId(context.params);

    return userController.getById(id);

  } catch (err: unknown) {

    console.error('❌ GET /api/users/[id] error:', err);

    return NextResponse.json(
      { error: 'ID inválido' },
      { status: 400 }
    );

  }
}



// PUT
export async function PUT(req: NextRequest, context: Context) {
  const authError = verificarDirector(req);
  if (authError) return authError;

  try {

    const id = await parseId(context.params);

    return userController.update(req, id);

  } catch (err: unknown) {

    console.error('❌ PUT /api/users/[id] error:', err);

    return NextResponse.json(
      { error: 'Error en PUT' },
      { status: 400 }
    );

  }
}


// PATCH
export async function PATCH(req: NextRequest, context: Context) {
  const authError = verificarDirector(req);
  if (authError) return authError;

  try {

    const id = await parseId(context.params);

    return userController.update(req, id);

  } catch (err: unknown) {

    console.error('❌ PATCH /api/users/[id] error:', err);

    return NextResponse.json(
      { error: 'Error en PATCH' },
      { status: 400 }
    );

  }
}


// DELETE
export async function DELETE(req: NextRequest, context: Context) {
  const authError = verificarDirector(req);
  if (authError) return authError;

  try {

    const id = await parseId(context.params);

    let changedBy: string | undefined;
    let changedByRole: string | undefined;

    try {

      const body = await req.json();

      if (body && typeof body === 'object') {

        const obj = body as Record<string, unknown>;

        if (typeof obj.changedBy === 'string') changedBy = obj.changedBy;
        if (typeof obj.changedByRole === 'string') changedByRole = obj.changedByRole;

      }

    } catch {}

    return userController.remove(id, changedBy, changedByRole);

  } catch (err: unknown) {

    console.error('❌ DELETE /api/users/[id] error:', err);

    return NextResponse.json(
      { error: 'Error en DELETE' },
      { status: 400 }
    );

  }
}