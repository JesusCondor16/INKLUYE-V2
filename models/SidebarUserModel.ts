// models/User.ts
export type UserRole = 'director' | 'coordinador' | 'docente' | 'estudiante';

export interface User {
  id: number | string;
  name: string;
  email: string;
  role: UserRole;
}
