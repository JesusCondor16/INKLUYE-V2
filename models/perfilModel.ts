import prisma from "@/lib/prisma";

export const perfilModel = {
  async getPerfilById(userId: number) {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cursosCoordinados: {
          select: { id: true, name: true, code: true },
        },
        cursoDocentes: {
          select: {
            course: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
  },

  async updatePerfil(userId: number, data: any) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
      },
    });
  },
};
