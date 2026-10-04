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

// Preferencia del usuario: anunciar o no las notificaciones nuevas (WCAG 2.1 - 2.2.4 Interrupciones, AAA).
// Es una comodidad de cada navegador, por eso va en localStorage y no en la base de datos.
export const CLAVE_PREFERENCIA_ANUNCIOS = 'inkluye:anunciarNotificaciones';

export function leerPreferenciaAnuncios(): boolean {
  try {
    return localStorage.getItem(CLAVE_PREFERENCIA_ANUNCIOS) !== 'no';
  } catch {
    // Navegacion privada o almacenamiento bloqueado: por defecto se anuncian
    return true;
  }
}

export function guardarPreferenciaAnuncios(anunciar: boolean): void {
  try {
    localStorage.setItem(CLAVE_PREFERENCIA_ANUNCIOS, anunciar ? 'si' : 'no');
  } catch {
    // Si no se puede guardar, la preferencia dura solo mientras la pagina este abierta
  }
}

// Cada cuanto se consultan notificaciones nuevas mientras la pagina esta abierta
export const INTERVALO_CONSULTA_MS = 60_000;

export function textoNoLeidas(n: number): string {
  return n === 1 ? 'Tienes 1 notificación sin leer' : `Tienes ${n} notificaciones sin leer`;
}
