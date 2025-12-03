// lib/authServer.ts
import jwtDecode from 'jwt-decode';
import { NextRequest } from 'next/server';

export interface CustomJwtPayload {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
}

export function obtenerUsuarioDesdeTokenServer(req: NextRequest): CustomJwtPayload | null {
  try {
    // 1️⃣ Obtener token desde la cookie 'token'
    const token = req.cookies.get('token')?.value;

    if (!token) {
      console.warn("⚠️ No se recibió token o no se pudo decodificar");
      return null;
    }

    // 2️⃣ Decodificar token
    const decoded = jwtDecode<CustomJwtPayload>(token);

    // ✅ Retornar usuario decodificado
    return decoded;
  } catch (error) {
    console.error('❌ Error al decodificar token en server:', error);
    return null;
  }
}
