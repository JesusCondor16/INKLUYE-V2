import prisma from '@/lib/prisma';

export const userModel = {
  /**
   * Buscar usuario por correo
   * @param email - Correo del usuario
   */
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        password: true,
      },
    });
  },

  /**
   * Buscar usuario por ID
   * @param id - ID del usuario
   */
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },

  /**
   * Listar todos los usuarios, con filtro opcional por roles
   * @param filter.roles - Ejemplo: ['docente', 'coordinador']
   */
  async findAll(filter?: { roles?: string[] }) {
    const whereClause = filter?.roles?.length
      ? { role: { in: filter.roles.map((r) => r.toLowerCase()) } }
      : {};

    return prisma.user.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },

  /**
   * Crear nuevo usuario
   */
  async create(data: { name: string; email: string; password: string; role: string }) {
    return prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },

  /**
   * Actualizar usuario
   */
  async update(
    id: number,
    data: Partial<{ name: string; email: string; password: string; role: string }>
  ) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },

  /**
   * Eliminar usuario
   */
  async delete(id: number) {
    return prisma.user.delete({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });
  },
};
