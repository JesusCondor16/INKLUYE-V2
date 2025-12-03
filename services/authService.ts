// server/services/authService.ts
import { userModel } from '@/models/userModel';
import { comparePasswords } from '@/lib/bcrypt';
import { generateToken } from '@/lib/jwt';

export type AuthSuccess = { token: string };
export class AuthError extends Error {
  public publicMessage: string;
  constructor(publicMessage = 'Credenciales inválidas', internalMessage?: string) {
    super(internalMessage ?? publicMessage);
    this.publicMessage = publicMessage;
    this.name = 'AuthError';
  }
}

/**
 * authService
 * - Normaliza email
 * - No filtra existencia de cuenta en mensajes públicos
 * - Punto para integrar bloqueo / rate limiting
 */
export const authService = {
  /**
   * Valida credenciales y devuelve token.
   * Lanza AuthError en caso de credenciales inválidas (mensaje público genérico).
   */
  async validateUser(email: string, password: string): Promise<AuthSuccess> {
    // Validación básica de inputs (evitar llamadas innecesarias)
    if (!email || !password) {
      throw new AuthError('Credenciales inválidas', 'email or password empty');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // TODO: Integrar contador de intentos / bloqueo por usuario o IP aquí
    // e.g. await loginAttemptsService.beforeAttempt(normalizedEmail, ip);

    // Buscar usuario en DB
    const user = await userModel.findByEmail(normalizedEmail);

    // Si no hay usuario o la contraseña falla, devolvemos el mismo error público
    if (!user) {
      // Log interno para auditoría (no revelar al cliente)
      console.warn(`[authService] login failed - user not found - email=${normalizedEmail}`);
      throw new AuthError('Credenciales inválidas', 'user not found');
    }

    const valid = await comparePasswords(password, user.password);
    if (!valid) {
      // Incrementar contador de intentos fallidos aquí si implementas lockout
      console.warn(`[authService] login failed - invalid password - userId=${user.id}`);
      throw new AuthError('Credenciales inválidas', 'invalid password');
    }

    // Opcional: resetear contador de intentos exitoso
    // await loginAttemptsService.reset(normalizedEmail);

    // Generar token con claims mínimos
    const token = generateToken({ id: user.id, role: user.role });

    // Logging de éxito (sin datos sensibles)
    console.info(`[authService] login success - userId=${user.id}`);

    return { token };
  },
};
