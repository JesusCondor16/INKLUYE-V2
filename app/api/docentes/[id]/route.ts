// app/api/docentes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { docenteController } from '@/controllers/docenteController';
import { obtenerUsuarioDesdeTokenServer, requiereRol } from '@/lib/authServer';

function badIdResponse() {
  return new Response(JSON.stringify({ error: 'ID inválido o no proporcionado' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
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
  const authError = verificarDirector(req);
  if (authError) return authError;

  const { id: idStr } = await context.params;
  if (!idStr) return badIdResponse();

  const id = Number(idStr);
  if (Number.isNaN(id)) return badIdResponse();

  return await docenteController.update(req as unknown as Request, id);
}

/**
 * DELETE /api/docentes/:id
 */
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authError = verificarDirector(req);
  if (authError) return authError;

  const { id: idStr } = await context.params;
  if (!idStr) return badIdResponse();

  const id = Number(idStr);
  if (Number.isNaN(id)) return badIdResponse();

  return await docenteController.remove(id);
}