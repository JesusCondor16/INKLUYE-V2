// app/api/users/[id]/route.ts
import { NextRequest } from 'next/server';
import { userController } from '@/controllers/userController';

type Context = { params: { id: string } };

function parseId(idStr: string) {
  const id = Number(idStr);
  if (!Number.isFinite(id) || id <= 0) throw new Error('ID inválido');
  return id;
}

export async function GET(_req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);
    return await userController.getById(id);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'ID inválido' }), { status: 400 });
  }
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);
    return await userController.update(req, id);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error en PUT' }), { status: 400 });
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);
    return await userController.update(req, id);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error en PATCH' }), { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);

    // Intentamos leer changedBy/changedByRole del body si se envía
    let changedBy: string | undefined;
    let changedByRole: string | undefined;
    try {
      // req.json() lanzará si no hay body o no es JSON; lo capturamos y seguimos
      const body = await req.json();
      if (body && typeof body === 'object') {
        if (typeof body.changedBy === 'string' && body.changedBy.trim() !== '') {
          changedBy = body.changedBy.trim();
        }
        if (typeof body.changedByRole === 'string' && body.changedByRole.trim() !== '') {
          changedByRole = body.changedByRole.trim();
        }
      }
    } catch (e) {
      // No hay body o no es JSON -> lo ignoramos (usará valores por defecto en controller)
    }

    return await userController.remove(id, changedBy, changedByRole);
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Error en DELETE' }), { status: 400 });
  }
}
