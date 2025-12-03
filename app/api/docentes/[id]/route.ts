// app/api/docentes/[id]/route.ts
import { NextRequest } from 'next/server';
import { docenteController } from '@/controllers/docenteController';

function badIdResponse() {
  return new Response(JSON.stringify({ error: 'ID inválido o no proporcionado' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * GET /api/docentes/:id
 */
export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return badIdResponse();

  const id = Number(idStr);
  if (Number.isNaN(id)) return badIdResponse();

  return await docenteController.getById(id);
}

/**
 * PUT /api/docentes/:id
 */
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return badIdResponse();

  const id = Number(idStr);
  if (Number.isNaN(id)) return badIdResponse();

  return await docenteController.update(req as unknown as Request, id);
}

/**
 * DELETE /api/docentes/:id
 */
export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await context.params;
  if (!idStr) return badIdResponse();

  const id = Number(idStr);
  if (Number.isNaN(id)) return badIdResponse();

  return await docenteController.remove(id);
}
