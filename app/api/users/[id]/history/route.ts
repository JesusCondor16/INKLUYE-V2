import { NextRequest, NextResponse } from 'next/server';
import { userController } from '@/controllers/userController';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Resolver el id desde la promesa
    const { id: idStr } = await context.params;

    const id = Number(idStr);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Llamamos al controlador
    const history = await userController.getHistory(id);

    return NextResponse.json(history, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message || 'ID inválido' }, { status: 400 });
  }
}
