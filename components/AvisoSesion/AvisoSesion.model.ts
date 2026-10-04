// components/AvisoSesion/AvisoSesion.model.ts
// Reglas del aviso de vencimiento de sesion (WCAG 2.1 - 2.2.5 y 2.2.6). Funciones puras, probadas con Jest.

// La sesion (JWT y cookie) dura 1 hora; se avisa 5 minutos antes
export const AVISO_ANTES_SEGUNDOS = 5 * 60;

export type FaseSesion = 'normal' | 'aviso' | 'vencida';

/**
 * @param expiraEn  vencimiento del token en segundos (campo "exp" del JWT), o null si no se conoce
 * @param ahora     hora actual en segundos
 */
export function faseSesion(expiraEn: number | null, ahora: number): FaseSesion {
  if (expiraEn === null) return 'normal';
  const restante = expiraEn - ahora;
  if (restante <= 0) return 'vencida';
  if (restante <= AVISO_ANTES_SEGUNDOS) return 'aviso';
  return 'normal';
}

/** Minutos que quedan, redondeados hacia arriba y nunca menos de 1 ("Queda 1 minuto") */
export function minutosRestantes(expiraEn: number, ahora: number): number {
  return Math.max(1, Math.ceil((expiraEn - ahora) / 60));
}
