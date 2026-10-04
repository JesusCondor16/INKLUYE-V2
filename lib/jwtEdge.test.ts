import jwt from 'jsonwebtoken';
import { verificarTokenEdge } from './jwtEdge';

// El token se firma igual que en lib/jwt.ts (jsonwebtoken, HS256)
// y se comprueba que la verificación del middleware lo acepta o rechaza igual
const SECRETO = 'secreto-de-prueba';
const AHORA = 1_800_000_000;

function firmar(payload: object, secreto = SECRETO) {
  return jwt.sign({ iat: AHORA, ...payload }, secreto, { expiresIn: '1h' });
}

describe('verificarTokenEdge', () => {
  it('acepta un token válido firmado con jsonwebtoken', async () => {
    const t = firmar({ id: 10, role: 'coordinador' });
    await expect(verificarTokenEdge(t, SECRETO, AHORA)).resolves.toMatchObject({ id: 10, role: 'coordinador' });
  });

  it('rechaza un token firmado con otra clave', async () => {
    const t = firmar({ id: 2, role: 'director' }, 'otra-clave');
    await expect(verificarTokenEdge(t, SECRETO, AHORA)).resolves.toBeNull();
  });

  it('rechaza un token vencido', async () => {
    const t = firmar({ id: 10, role: 'coordinador' }); // vence en AHORA + 3600
    await expect(verificarTokenEdge(t, SECRETO, AHORA + 3600)).resolves.toBeNull();
  });

  it('rechaza un token con el contenido modificado (rol cambiado a director)', async () => {
    const [h, , f] = firmar({ id: 4, role: 'estudiante' }).split('.');
    const falso = Buffer.from(JSON.stringify({ id: 4, role: 'director', exp: AHORA + 3600 })).toString('base64url');
    await expect(verificarTokenEdge(`${h}.${falso}.${f}`, SECRETO, AHORA)).resolves.toBeNull();
  });

  it('rechaza un token con "alg": "none" (sin firma)', async () => {
    const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const p = Buffer.from(JSON.stringify({ id: 2, role: 'director', exp: AHORA + 3600 })).toString('base64url');
    await expect(verificarTokenEdge(`${h}.${p}.`, SECRETO, AHORA)).resolves.toBeNull();
  });

  it('rechaza textos que no son un JWT', async () => {
    await expect(verificarTokenEdge('basura', SECRETO, AHORA)).resolves.toBeNull();
    await expect(verificarTokenEdge('a.b.c', SECRETO, AHORA)).resolves.toBeNull();
    await expect(verificarTokenEdge('', SECRETO, AHORA)).resolves.toBeNull();
  });

  it('rechaza todo si no hay secreto configurado', async () => {
    const t = firmar({ id: 10, role: 'coordinador' });
    await expect(verificarTokenEdge(t, '', AHORA)).resolves.toBeNull();
  });
});
