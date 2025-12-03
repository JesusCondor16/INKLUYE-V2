// services/userService.ts
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const userService = {
  /** Obtener todos los usuarios */
  async getAll(roles?: string[]) {
    try {
      if (roles && roles.length > 0) {
        const lowerRoles = roles.map(r => r.toLowerCase());
        return await prisma.user.findMany({
          where: { role: { in: lowerRoles } },
          select: { id: true, name: true, email: true, role: true },
          orderBy: { name: 'asc' },
        });
      }
      return await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });
    } catch (error: any) {
      console.error('❌ Error en userService.getAll:', error);
      throw new Error('No se pudieron obtener los usuarios');
    }
  },

  /** Crear usuario */
  async create(data: { name: string; email: string; password: string; role: string }) {
    try {
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new Error('El correo ya está registrado');

      const hashedPassword = await bcrypt.hash(data.password, 10);
      const normalizedRole = data.role.toLowerCase();

      return await prisma.user.create({
        data: { ...data, password: hashedPassword, role: normalizedRole },
        select: { id: true, name: true, email: true, role: true },
      });
    } catch (error: any) {
      console.error('❌ Error en userService.create:', error);
      throw new Error(error.message || 'Error al crear usuario');
    }
  },

  /** Actualizar usuario */
  async update(
    id: number,
    data: Partial<{ name: string; email: string; password: string; role: string }>
  ) {
    try {
      // Si cambian el email, validar unicidad
      if (data.email) {
        const exists = await prisma.user.findFirst({
          where: { email: data.email, NOT: { id } as any },
        });
        if (exists) throw new Error('El correo ya está registrado por otro usuario');
      }

      if (data.password) {
        data.password = await bcrypt.hash(data.password, 10);
      }
      if (data.role) {
        data.role = data.role.toLowerCase();
      }

      const updated = await prisma.user.update({
        where: { id },
        data,
        select: { id: true, name: true, email: true, role: true },
      });

      return updated;
    } catch (error: any) {
      console.error('❌ Error en userService.update:', error);
      throw new Error(error.message || 'Error al actualizar usuario');
    }
  },

  /** Eliminar usuario (transaccional) */
    async remove(id: number) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // 1) Eliminar relaciones dependientes
          await tx.cursodocente.deleteMany({ where: { userId: id } });

          // 2) Eliminar historial del usuario (si no quieres conservarlo)
          await tx.userhistory.deleteMany({ where: { userId: id } });

          // 3) Finalmente eliminar al usuario
          const deleted = await tx.user.delete({
            where: { id },
            select: { id: true, name: true, email: true, role: true },
          });

          return deleted;
        });

        return result;
      } catch (error: any) {
        console.error('❌ Error en userService.remove:', error);
        throw new Error(error.message || 'Error al eliminar usuario');
      }
    },

  /** Obtener usuario por ID */
  async getById(id: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!user) throw new Error('Usuario no encontrado');
      return user;
    } catch (error: any) {
      console.error('❌ Error en userService.getById:', error);
      throw new Error(error.message || 'Error al obtener usuario');
    }
  },
};
