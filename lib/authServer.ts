// lib/authServer.ts
import { NextRequest } from 'next/server';
import { verifyToken } from './jwt';
import { prisma } from './prisma';

export interface CustomJwtPayload {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
}

function esCustomJwtPayload(decoded: unknown): decoded is CustomJwtPayload {
  return (
    typeof decoded === 'object' &&
    decoded !== null &&
    'id' in decoded
  );
}

export function obtenerUsuarioDesdeTokenServer(req: NextRequest): CustomJwtPayload | null {
  try {
    const token = req.cookies.get('token')?.value;

    if (!token) {
      console.warn("⚠️ No se recibió token");
      return null;
    }

    const decoded = verifyToken(token);

    if (!decoded || !esCustomJwtPayload(decoded)) {
      console.warn("⚠️ Token inválido, expirado o con formato inesperado");
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('❌ Error al verificar token en server:', error);
    return null;
  }
}

export function requiereRol(usuario: CustomJwtPayload | null, ...rolesPermitidos: string[]): boolean {
  return !!usuario && !!usuario.role && rolesPermitidos.includes(usuario.role);
}

export async function esCoordinadorDelCurso(usuario: CustomJwtPayload | null, cursoId: number): Promise<boolean> {
  if (!usuario || usuario.role !== 'coordinador') return false;

  const curso = await prisma.course.findUnique({
    where: { id: cursoId },
    select: { coordinadorId: true },
  });

  return curso?.coordinadorId === usuario.id;
}

