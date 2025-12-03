import { NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import prisma from '@/lib/prisma';

export const userController = {
  /** Obtener todos los usuarios (con filtro opcional por roles) */
  async getAll(req?: Request) {
    try {
      let rolesArray: string[] | undefined;

      if (req) {
        const url = new URL(req.url);
        const roles = url.searchParams.get('roles');
        if (roles) {
          rolesArray = roles
            .split(',')
            .map((r) => r.trim().toLowerCase())
            .filter((r) => r.length > 0);
        }
      }

      const users = await userService.getAll(rolesArray);
      return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error en userController.getAll:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuarios: ' + error.message },
        { status: 500 }
      );
    }
  },

  /** Crear nuevo usuario */
  async create(req: Request) {
    try {
      const data = await req.json();

      if (!data.name || !data.email || !data.password || !data.role) {
        return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
      }

      const newUser = await userService.create(data);

      // Registrar en historial
      await prisma.userhistory.create({
        data: {
          userId: newUser.id,
          changedBy: data.changedBy ?? 'Sistema',
          changedByRole: data.changedByRole ?? 'Desconocido',
          description: `Usuario creado: Nombre: ${data.name}, Email: ${data.email}, Rol: ${data.role}`,
        },
      });

      // No se retorna password
      const { password, ...userSafe } = newUser as any;

      return NextResponse.json(userSafe, { status: 201 });
    } catch (error: any) {
      console.error('❌ Error en userController.create:', error);
      return NextResponse.json(
        { error: 'Error al crear usuario: ' + error.message },
        { status: 400 }
      );
    }
  },

  /** Actualizar usuario por ID */
  async update(req: Request, id: number) {
    try {
      const data = await req.json();
      const userActual = await userService.getById(id);

      if (!userActual) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }

      const updatedUser = await userService.update(id, data);

      // Registrar cambios
      const cambios: string[] = [];
      if (data.name && data.name !== userActual.name) cambios.push(`Nombre: ${userActual.name} → ${data.name}`);
      if (data.email && data.email !== userActual.email) cambios.push(`Email: ${userActual.email} → ${data.email}`);
      if (data.role && data.role !== userActual.role) cambios.push(`Rol: ${userActual.role} → ${data.role}`);

      if (cambios.length > 0) {
        await prisma.userhistory.create({
          data: {
            userId: id,
            changedBy: data.changedBy ?? 'Sistema',
            changedByRole: data.changedByRole ?? 'Desconocido',
            description: cambios.join(', '),
          },
        });
      }

      // No se retorna password
      const { password, ...userSafe } = updatedUser as any;

      return NextResponse.json(userSafe, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error en userController.update:', error);
      return NextResponse.json(
        { error: 'Error al actualizar usuario: ' + error.message },
        { status: 400 }
      );
    }
  },

  /** Eliminar usuario por ID */
  async remove(id: number, changedBy?: string, changedByRole?: string) {
    try {
      const deletedUser = await userService.remove(id);
      const { password, ...userSafe } = deletedUser as any;
      return NextResponse.json(userSafe, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error en userController.remove:', error);
      return NextResponse.json(
        { error: 'Error al eliminar usuario: ' + error.message },
        { status: 400 }
      );
    }
  },

  /** Obtener usuario por ID */
  async getById(id: number) {
    try {
      const user = await userService.getById(id);
      if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      const { password, ...userSafe } = user as any;
      return NextResponse.json(userSafe, { status: 200 });
    } catch (error: any) {
      console.error('❌ Error en userController.getById:', error);
      return NextResponse.json(
        { error: 'Error al obtener usuario: ' + error.message },
        { status: 500 }
      );
    }
  },

  /** Obtener historial de un usuario */
  async getHistory(id: number) {
    try {
      const historial = await prisma.userhistory.findMany({
        where: { userId: id },
        orderBy: { changeDate: 'desc' },
      });

      return NextResponse.json(historial || [], { status: 200 });
    } catch (error: any) {
      console.error('❌ Error en userController.getHistory:', error);
      return NextResponse.json(
        { error: 'Error al obtener historial: ' + error.message },
        { status: 500 }
      );
    }
  },
};
