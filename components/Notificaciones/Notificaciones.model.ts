// components/Notificaciones/Notificaciones.model.ts
export interface Notificacion {
  id: number;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: string;
}

export interface NotificacionesResponse {
  noLeidas: number;
  notificaciones: Notificacion[];
}

// Cada cuanto se consultan notificaciones nuevas mientras la pagina esta abierta
export const INTERVALO_CONSULTA_MS = 60_000;

export function textoNoLeidas(n: number): string {
  return n === 1 ? 'Tienes 1 notificación sin leer' : `Tienes ${n} notificaciones sin leer`;
}
