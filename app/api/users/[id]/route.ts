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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || 'ID inválido' }), { status: 400 });
  }
}

export async function PUT(req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);
    return await userController.update(req, id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || 'Error en PUT' }), { status: 400 });
  }
}

export async function PATCH(req: NextRequest, context: Context) {
  try {
    const id = parseId(context.params.id);
    return await userController.update(req, id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || 'Error en PATCH' }), { status: 400 });
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
        const bodyObj = body as Record<string, unknown>;
        if (typeof bodyObj.changedBy === 'string' && bodyObj.changedBy.trim() !== '') {
          changedBy = bodyObj.changedBy.trim();
        }
        if (typeof bodyObj.changedByRole === 'string' && bodyObj.changedByRole.trim() !== '') {
          changedByRole = bodyObj.changedByRole.trim();
        }
      }
    } catch {
      // No hay body o no es JSON -> lo ignoramos
    }

    return await userController.remove(id, changedBy, changedByRole);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || 'Error en DELETE' }), { status: 400 });
  }
}
