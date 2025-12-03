import jwtDecode from 'jwt-decode';
import type { UserRole } from '../models/SidebarUserModel';
import getMenuByRole, { MenuItem } from '../utils/getMenuByRole';

/**
 * Obtener rol de usuario desde token JWT
 */
export function getUserRoleFromToken(): UserRole {
  const token = localStorage.getItem('token');
  if (!token) return 'docente';

  try {
    const decoded = jwtDecode<{ role?: string }>(token);
    const role = decoded.role?.toLowerCase();
    switch (role) {
      case 'director':
      case 'coordinador':
      case 'docente':
      case 'estudiante':
        return role as UserRole;
      default:
        return 'docente';
    }
  } catch (err) {
    console.warn('[SidebarController] Error decoding token', err);
    return 'docente';
  }
}

/**
 * Obtener menú de navegación según rol
 */
export function getSidebarMenu(role: UserRole): MenuItem[] {
  return getMenuByRole(role);
}

/**
 * Cerrar sesión
 */
export function logoutUser(): void {
  localStorage.removeItem('token');
}
