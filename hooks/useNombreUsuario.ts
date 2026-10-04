import { useSesion } from '@/hooks/useSesion';

/**
 * Hook para obtener el nombre del usuario
 * Maneja carga, éxito y errores de forma accesible
 * (antes decodificaba el token de localStorage y volvia a pedir /api/users/[id])
 */
export function useNombreUsuario() {
  const sesion = useSesion();

  if (sesion.estado === 'cargando') {
    return { nombre: 'Cargando...', status: 'loading' as const, error: '' };
  }
  if (sesion.estado === 'activa') {
    return { nombre: sesion.user.name || 'Usuario', status: 'success' as const, error: '' };
  }
  if (sesion.estado === 'sin-sesion') {
    return { nombre: 'Usuario', status: 'error' as const, error: 'Su sesión expiró. Inicie sesión nuevamente.' };
  }
  return { nombre: 'Usuario', status: 'error' as const, error: 'No se pudo cargar el nombre del usuario.' };
}
