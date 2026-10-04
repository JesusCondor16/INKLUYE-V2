import { requiereRol, esDirectorOCoordinadorDelCurso, CustomJwtPayload } from './authServer';
import { prisma } from './prisma';

// La base de datos se simula: solo interesa a quien pertenece cada curso
jest.mock('./prisma', () => ({
  prisma: { course: { findUnique: jest.fn() } },
}));

const findUnique = prisma.course.findUnique as jest.Mock;

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

describe('esDirectorOCoordinadorDelCurso', () => {
  const CURSO = 1;

  beforeEach(() => {
    findUnique.mockReset();
    // El curso 1 pertenece al coordinador con id 10
    findUnique.mockResolvedValue({ coordinadorId: 10 });
  });

  it('el director puede ver cualquier curso sin consultar al dueño', async () => {
    await expect(esDirectorOCoordinadorDelCurso({ id: 2, role: 'director' }, CURSO)).resolves.toBe(true);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it('el coordinador dueño del curso puede verlo', async () => {
    await expect(esDirectorOCoordinadorDelCurso({ id: 10, role: 'coordinador' }, CURSO)).resolves.toBe(true);
  });

  it('otro coordinador NO puede ver un curso ajeno', async () => {
    await expect(esDirectorOCoordinadorDelCurso({ id: 11, role: 'coordinador' }, CURSO)).resolves.toBe(false);
  });

  it('un docente no puede verlo aunque su id coincida con el del coordinador', async () => {
    await expect(esDirectorOCoordinadorDelCurso({ id: 10, role: 'docente' }, CURSO)).resolves.toBe(false);
  });

  it('un estudiante no puede verlo', async () => {
    await expect(esDirectorOCoordinadorDelCurso({ id: 4, role: 'estudiante' }, CURSO)).resolves.toBe(false);
  });

  it('sin sesión no puede verlo', async () => {
    await expect(esDirectorOCoordinadorDelCurso(null, CURSO)).resolves.toBe(false);
  });

  it('si el curso no existe, el coordinador no puede verlo', async () => {
    findUnique.mockResolvedValue(null);
    await expect(esDirectorOCoordinadorDelCurso({ id: 10, role: 'coordinador' }, 999)).resolves.toBe(false);
  });
});