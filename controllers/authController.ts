// app/controllers/authController.ts
import jwt from 'jsonwebtoken';
import jwtDecode from 'jwt-decode';
import { authService, AuthError } from '@/services/authService'; // ajusta la ruta a tu servicio
// import { loginAttemptsService } from '@/server/services/loginAttemptsService'; // opcional: rate-limit/lockout

type LoginResult = {
  token: string;
  user: {
    id: string | number;
    name?: string;
    email?: string;
    role?: string;
  };
  to?: string;
};

type DecodedToken = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
  [k: string]: any;
};

/** Mapear rol a ruta destino */
function mapRoleToRoute(role?: string): string | undefined {
  if (!role) return undefined;
  switch (role.toLowerCase()) {
    case 'director':
      return '/director';
    case 'coordinador':
      return '/coordinador';
    case 'docente':
      return '/docente';
    case 'estudiante':
    case 'alumno':
      return '/alumno';
    default:
      return undefined;
  }
}

export const authController = {
  /**
   * Realiza login: normaliza, delega en authService, extrae rol y devuelve destino.
   * Lanza AuthError para credenciales inválidas (mensaje público).
   * Lanza Error genérico para fallos internos.
   */
  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password) {
      throw new AuthError('Credenciales inválidas', 'email or password empty');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Opcional: chekear bloqueo / rate-limiting antes del intento
    // await loginAttemptsService.beforeAttempt(normalizedEmail);

    try {
      // Delegamos la validación y obtención del token al servicio
      const { token } = await authService.validateUser(normalizedEmail, password);

      if (!token) {
        // No debería pasar si el servicio está bien; lo tratamos como error interno
        throw new Error('No se devolvió token desde authService');
      }

      // Intentar verificar la firma del token en servidor (recomendado)
      let decoded: DecodedToken = {};
      const secret = process.env.JWT_SECRET;

      if (secret) {
        try {
          // verify -> lanza si inválido
          const payload = jwt.verify(token, secret) as DecodedToken;
          decoded = payload || {};
        } catch (verifyErr) {
          // Si la verificación falla, lo registramos y dejamos decoded vacío
          console.warn('[authController] JWT verification failed:', verifyErr);
          // Intentamos fallback a decode (no verificado) para extraer role si es estrictamente necesario
          try {
            decoded = (jwt.decode(token) as DecodedToken) || {};
          } catch (_e) {
            decoded = {};
          }
        }
      } else {
        // En dev sin secret: decodificamos sin verificar (no seguro en prod)
        console.warn('[authController] JWT_SECRET not set. Decoding token without verification.');
        try {
          decoded = (jwt.decode(token) as DecodedToken) || {};
        } catch (_e) {
          decoded = {};
        }
      }

      const role = decoded?.role ? String(decoded.role) : undefined;
      const to = mapRoleToRoute(role);

      // Opcional: resetear contador de intentos en caso exitoso
      // await loginAttemptsService.reset(normalizedEmail);

      // Construir user safe (sin password)
      const user = {
        id: decoded?.id ?? undefined,
        name: decoded?.name ?? undefined,
        email: decoded?.email ?? normalizedEmail,
        role: role,
      };

      console.info(`[authController] login success - email=${normalizedEmail} role=${role ?? 'unknown'}`);

      return { token, user: user as LoginResult['user'], to };
    } catch (err: any) {
      // Si es AuthError (publicMessage), lo propagamos para que el route.ts lo transforme a 401
      if (err instanceof AuthError) {
        // Opcional: incrementar contador de intentos fallidos aquí
        // await loginAttemptsService.afterFailedAttempt(normalizedEmail);
        console.warn('[authController] authentication failed:', err);
        throw err;
      }

      // Errores esperados con message pública: si tu authService lanza Error con mensaje,
      // puedes mapearlo a AuthError aquí según convenga.
      // Por seguridad, no exponemos errores internos:
      console.error('[authController] unexpected error during login:', err);
      throw new Error('Error interno de autenticación');
    }
  },
};
