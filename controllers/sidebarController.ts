import type { UserRole } from '../models/SidebarUserModel';
import getMenuByRole, { MenuItem } from '../utils/getMenuByRole';

/**
 * Normalizar el rol que llega de /api/perfil
 * (antes se decodificaba el token guardado en localStorage)
 */
export function normalizarRol(role?: string | null): UserRole | null {
  switch (role?.toLowerCase()) {
    case 'director':
    case 'coordinador':
    case 'docente':
    case 'estudiante':
      return role!.toLowerCase() as UserRole;
    default:
      return null;
  }
}

/**
 * Obtener menú de navegación según rol
 */
export function getSidebarMenu(role: UserRole): MenuItem[] {
  return getMenuByRole(role);
}

/**
 * Cerrar sesión: el servidor borra la cookie httpOnly del token
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    // Limpia el token que guardaban versiones anteriores del login
    localStorage.removeItem('token');
  }
}
