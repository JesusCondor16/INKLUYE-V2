// lib/bcrypt.ts
import bcrypt from 'bcryptjs';

export async function comparePasswords(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
