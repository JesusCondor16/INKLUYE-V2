import { faseSesion, minutosRestantes, AVISO_ANTES_SEGUNDOS } from './AvisoSesion.model';

const AHORA = 1_800_000_000;

describe('faseSesion', () => {
  it('sin vencimiento conocido no muestra nada', () => {
    expect(faseSesion(null, AHORA)).toBe('normal');
  });

  it('con más de 5 minutos restantes no avisa', () => {
    expect(faseSesion(AHORA + AVISO_ANTES_SEGUNDOS + 1, AHORA)).toBe('normal');
  });

  it('avisa justo a los 5 minutos y durante los últimos minutos', () => {
    expect(faseSesion(AHORA + AVISO_ANTES_SEGUNDOS, AHORA)).toBe('aviso');
    expect(faseSesion(AHORA + 1, AHORA)).toBe('aviso');
  });

  it('al llegar al vencimiento (o después) la sesión está vencida', () => {
    expect(faseSesion(AHORA, AHORA)).toBe('vencida');
    expect(faseSesion(AHORA - 3600, AHORA)).toBe('vencida');
  });
});

describe('minutosRestantes', () => {
  it('redondea hacia arriba', () => {
    expect(minutosRestantes(AHORA + 4 * 60 + 1, AHORA)).toBe(5);
    expect(minutosRestantes(AHORA + 60, AHORA)).toBe(1);
  });

  it('nunca muestra 0 minutos mientras la sesión sigue vigente', () => {
    expect(minutosRestantes(AHORA + 5, AHORA)).toBe(1);
  });
});
