import { requiereRol, CustomJwtPayload } from './authServer';

describe('requiereRol', () => {
  const director: CustomJwtPayload = { id: 1, role: 'director' };
  const coordinador: CustomJwtPayload = { id: 2, role: 'coordinador' };

  it('permite el acceso cuando el rol del usuario está en la lista permitida', () => {
    expect(requiereRol(director, 'director')).toBe(true);
  });

  it('deniega el acceso cuando el rol del usuario no está en la lista permitida', () => {
    expect(requiereRol(coordinador, 'director')).toBe(false);
  });

  it('permite el acceso cuando se listan varios roles y el usuario tiene uno de ellos', () => {
    expect(requiereRol(coordinador, 'director', 'coordinador')).toBe(true);
  });

  it('deniega el acceso cuando el usuario es null', () => {
    expect(requiereRol(null, 'director')).toBe(false);
  });

  it('deniega el acceso cuando el usuario no tiene rol', () => {
    expect(requiereRol({ id: 3 }, 'director')).toBe(false);
  });
});