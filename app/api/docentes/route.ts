// app/api/docentes/route.ts
import { NextRequest } from 'next/server';
import { docenteController } from '@/controllers/docenteController';

export async function GET() {
  return await docenteController.getAll();
}

export async function POST(req: NextRequest) {
  return await docenteController.create(req);
}
