import { NextResponse } from 'next/server';
import { docenteService } from '@/services/docenteService';

export const docenteController = {
  async getAll() {
    try {
      const docentes = await docenteService.getAll();
      return NextResponse.json(docentes, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error docenteController.getAll:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },

  async getById(id: number) {
    try {
      const docente = await docenteService.getById(id);
      if (!docente) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 });
      return NextResponse.json(docente, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error docenteController.getById:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  },

  async create(req: Request) {
    try {
      const data = await req.json();
      if (!data.name || !data.email || !data.password) {
        return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
      }
      const newDocente = await docenteService.create(data);
      return NextResponse.json(newDocente, { status: 201 });
    } catch (error: any) {
      console.error('❌ Error docenteController.create:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  },

  async update(req: Request, id: number) {
    try {
      const data = await req.json();
      const updated = await docenteService.update(id, data);
      return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error docenteController.update:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  },

  async remove(id: number) {
    try {
      const deleted = await docenteService.remove(id);
      return NextResponse.json(deleted, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error docenteController.remove:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  },
};
