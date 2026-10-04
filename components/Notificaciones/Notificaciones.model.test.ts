import {
  CLAVE_PREFERENCIA_ANUNCIOS,
  leerPreferenciaAnuncios,
  guardarPreferenciaAnuncios,
  textoNoLeidas,
} from './Notificaciones.model';

// Jest corre en Node (sin navegador): se simula localStorage con un Map
function simularLocalStorage() {
  const datos = new Map<string, string>();
  const almacen = {
    getItem: jest.fn((k: string) => datos.get(k) ?? null),
    setItem: jest.fn((k: string, v: string) => void datos.set(k, v)),
  };
  Object.defineProperty(globalThis, 'localStorage', { value: almacen, configurable: true });
  return almacen;
}

describe('preferencia de anuncios de notificaciones (WCAG 2.1 - 2.2.4)', () => {
  let almacen: ReturnType<typeof simularLocalStorage>;
  beforeEach(() => {
    almacen = simularLocalStorage();
  });

  it('por defecto se anuncian', () => {
    expect(leerPreferenciaAnuncios()).toBe(true);
  });

  it('si el usuario las silencia, se recuerda', () => {
    guardarPreferenciaAnuncios(false);
    expect(almacen.setItem).toHaveBeenCalledWith(CLAVE_PREFERENCIA_ANUNCIOS, 'no');
    expect(leerPreferenciaAnuncios()).toBe(false);
  });

  it('se pueden volver a activar', () => {
    guardarPreferenciaAnuncios(false);
    guardarPreferenciaAnuncios(true);
    expect(leerPreferenciaAnuncios()).toBe(true);
  });

  it('si el almacenamiento está bloqueado no falla y anuncia por defecto', () => {
    almacen.getItem.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    almacen.setItem.mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => guardarPreferenciaAnuncios(false)).not.toThrow();
    expect(leerPreferenciaAnuncios()).toBe(true);
  });
});

describe('textoNoLeidas', () => {
  it('usa singular y plural', () => {
    expect(textoNoLeidas(1)).toBe('Tienes 1 notificación sin leer');
    expect(textoNoLeidas(3)).toBe('Tienes 3 notificaciones sin leer');
  });
});
