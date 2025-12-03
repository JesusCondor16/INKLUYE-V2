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
    return await userController.getHistory(id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message || 'ID inválido' }), { status: 400 });
  }
}
