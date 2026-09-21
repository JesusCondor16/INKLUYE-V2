import { generateToken, verifyToken } from './jwt';

describe('lib/jwt', () => {
  it('genera un token que verifyToken puede validar y recuperar el payload original', () => {
    const token = generateToken({ id: 1, role: 'coordinador' });
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ id: 1, role: 'coordinador' });
  });

  it('devuelve null para un token con firma alterada', () => {
    const token = generateToken({ id: 1, role: 'coordinador' });
    const tokenAlterado = token.slice(0, -2) + 'xx';
    expect(verifyToken(tokenAlterado)).toBeNull();
  });

  it('devuelve null para un string que no es un JWT', () => {
    expect(verifyToken('esto-no-es-un-token')).toBeNull();
  });
});