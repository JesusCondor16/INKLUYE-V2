import { NextResponse } from 'next/server';
import { userService } from '@/services/userService';
import { userHistoryController } from '@/controllers/userHistoryController';

export const userController = {

  /** Obtener todos los usuarios */
  async getAll(req?: Request) {
    try {

      let rolesArray: string[] | undefined;

      if (req) {

        const url = new URL(req.url);

        const rolesParam =
          url.searchParams.get('roles') ||
          url.searchParams.get('role');

        if (rolesParam) {
          rolesArray = rolesParam
            .split(',')
            .map(r => r.trim().toLowerCase())
            .filter(r => r.length > 0);
        }

      }

      const users = await userService.getAll(rolesArray);

      return NextResponse.json(users, { status: 200 });

    } catch (error: unknown) {

      console.error('❌ Error en userController.getAll:', error);

      return NextResponse.json(
        { error: 'Error al obtener usuarios' },
        { status: 500 }
      );

    }
  },



  /** Crear usuario */
  async create(req: Request) {
    try {

      const data = await req.json();

      if (!data.name || !data.email || !data.password || !data.role) {
        return NextResponse.json(
          { error: 'Faltan datos obligatorios' },
          { status: 400 }
        );
      }

      const newUser = await userService.create(data);

      /** Registrar historial */
      await userHistoryController.createHistory({
        userId: newUser.id,
        changedBy: data.changedBy ?? 'Sistema',
        changedByRole: data.changedByRole ?? 'Sistema',
        description: `Usuario creado: Nombre: ${data.name}, Email: ${data.email}, Rol: ${data.role}`
      });

      return NextResponse.json(newUser, { status: 201 });

    } catch (error: unknown) {

      console.error('❌ Error en userController.create:', error);

      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 400 }
      );

    }
  },



  /** Actualizar usuario */
  async update(req: Request, id: number) {
    try {

      const data = await req.json();

      const userActual = await userService.getById(id);

      if (!userActual) {
        return NextResponse.json(
          { error: 'Usuario no encontrado' },
          { status: 404 }
        );
      }

      const cambios: string[] = [];

      if (data.name && userActual.name !== data.name) {
        cambios.push(`Nombre: ${userActual.name} → ${data.name}`);
      }

      if (data.email && userActual.email !== data.email) {
        cambios.push(`Email: ${userActual.email} → ${data.email}`);
      }

      if (data.role && userActual.role !== data.role.toLowerCase().trim()) {
        cambios.push(`Rol: ${userActual.role} → ${data.role}`);
      }

      const updatedUser = await userService.update(id, data);

      /** Registrar historial si hubo cambios */
      if (cambios.length > 0) {

        await userHistoryController.createHistory({
          userId: id,
          changedBy: data.changedBy ?? 'Sistema',
          changedByRole: data.changedByRole ?? 'Sistema',
          description: cambios.join(' | ')
        });

      }

      return NextResponse.json(updatedUser, { status: 200 });

    } catch (error: unknown) {

      console.error('❌ Error en userController.update:', error);

      return NextResponse.json(
        { error: 'Error al actualizar usuario' },
        { status: 400 }
      );

    }
  },



  /** Eliminar usuario */
  async remove(id: number, changedBy?: string, changedByRole?: string) {
    try {

      const deletedUser = await userService.remove(id);

      await userHistoryController.createHistory({
        userId: id,
        changedBy: changedBy ?? 'Sistema',
        changedByRole: changedByRole ?? 'Sistema',
        description: 'Usuario eliminado'
      });

      return NextResponse.json(deletedUser, { status: 200 });

    } catch (error: unknown) {

      console.error('❌ Error en userController.remove:', error);

      return NextResponse.json(
        { error: 'Error al eliminar usuario' },
        { status: 400 }
      );

    }
  },



  /** Obtener usuario por ID */
  async getById(id: number) {
    try {

      const user = await userService.getById(id);

      return NextResponse.json(user, { status: 200 });

    } catch (error: unknown) {

      console.error('❌ Error en userController.getById:', error);

      return NextResponse.json(
        { error: 'Error al obtener usuario' },
        { status: 500 }
      );

    }
  }

};