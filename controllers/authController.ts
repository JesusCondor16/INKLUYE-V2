// controllers/authController.ts
import { verifyToken } from '@/lib/jwt';
import { authService, AuthError } from '@/services/authService';

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
  async login(email: string, password: string): Promise<LoginResult> {
    if (!email || !password) {
      throw new AuthError('Credenciales inválidas', 'email or password empty');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    try {
      const { token } = await authService.validateUser(normalizedEmail, password);

      if (!token) {
        throw new Error('No se devolvió token desde authService');
      }

      const decoded = verifyToken(token) as DecodedToken | null;

      if (!decoded) {
        console.error('[authController] Token recién firmado no pudo verificarse');
        throw new Error('Error interno de autenticación');
      }

      const role = decoded.role ? String(decoded.role) : undefined;
      const to = mapRoleToRoute(role);

      const user = {
        id: decoded.id ?? undefined,
        name: decoded.name ?? undefined,
        email: decoded.email ?? normalizedEmail,
        role: role,
      };

      console.info(`[authController] login success - email=${normalizedEmail} role=${role ?? 'unknown'}`);

      return { token, user: user as LoginResult['user'], to };
    } catch (err: any) {
      if (err instanceof AuthError) {
        console.warn('[authController] authentication failed:', err);
        throw err;
      }

      console.error('[authController] unexpected error during login:', err);
      throw new Error('Error interno de autenticación');
    }
  },
};