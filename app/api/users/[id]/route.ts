import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';

// Ahora context es compatible con App Router
type Context = { params: Promise<{ id: string }> };

// Función para parsear ID
async function parseId(paramsPromise: Promise<{ id: string }>) {
  const { id } = await paramsPromise;
  const numId = Number(id);
  if (!Number.isFinite(numId) || numId <= 0) throw new Error('ID inválido');
  return numId;
}

// GET
export async function GET(_req: NextRequest, context: Context) {
  try {
    const id = await parseId(context.params);
    const user = await userController.getById(id);
    return NextResponse.json(user);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || 'ID inválido' }, { status: 400 });
  }
}

// PUT
export async function PUT(req: NextRequest, context: Context) {
  try {
    const id = await parseId(context.params);
    const updated = await userController.update(req, id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || 'Error en PUT' }, { status: 400 });
  }
}

// PATCH
export async function PATCH(req: NextRequest, context: Context) {
  try {
    const id = await parseId(context.params);
    const updated = await userController.update(req, id);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || 'Error en PATCH' }, { status: 400 });
  }
}

// DELETE
export async function DELETE(req: NextRequest, context: Context) {
  try {
    const id = await parseId(context.params);

    // Intentamos leer changedBy/changedByRole del body si se envía
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

    const deleted = await userController.remove(id, changedBy, changedByRole);
    return NextResponse.json(deleted);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || 'Error en DELETE' }, { status: 400 });
  }
}
