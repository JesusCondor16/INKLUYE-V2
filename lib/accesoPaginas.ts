// lib/accesoPaginas.ts
// Reglas de acceso a las PAGINAS (las rutas /api/* se protegen cada una por su cuenta).
// Funcion pura: la usa middleware.ts y se prueba con Jest.

export type Rol = 'director' | 'coordinador' | 'docente' | 'estudiante';

export type DecisionAcceso =
  | { tipo: 'permitir' }
  | { tipo: 'login'; sesionExpirada: boolean }
  | { tipo: 'redirigir'; destino: string };

// Pagina de inicio de cada rol (la misma a la que lleva el login)
export const INICIO_POR_ROL: Record<Rol, string> = {
  director: '/director',
  coordinador: '/coordinador',
  docente: '/docente',
  estudiante: '/alumno',
};

const PUBLICAS = ['/', '/login'];

// El orden importa: la regla mas especifica va primero
const REGLAS: { prefijo: string; roles: Rol[] }[] = [
  { prefijo: '/director', roles: ['director'] },
  { prefijo: '/coordinador', roles: ['coordinador'] },
  // "Sílabos por revisar": la usan docentes y coordinadores que dictan el curso
  { prefijo: '/docente/syllabus', roles: ['docente', 'coordinador'] },
  { prefijo: '/docente', roles: ['docente'] },
  { prefijo: '/alumno', roles: ['estudiante'] },
  // Paginas comunes a cualquier usuario con sesion
  { prefijo: '/buscar', roles: ['director', 'coordinador', 'docente', 'estudiante'] },
  { prefijo: '/perfil', roles: ['director', 'coordinador', 'docente', 'estudiante'] },
  { prefijo: '/informacion', roles: ['director', 'coordinador', 'docente', 'estudiante'] },
  { prefijo: '/glosario', roles: ['director', 'coordinador', 'docente', 'estudiante'] },
];

function coincide(pathname: string, prefijo: string): boolean {
  return pathname === prefijo || pathname.startsWith(prefijo + '/');
}

function esRol(valor: unknown): valor is Rol {
  // hasOwn y no "in": "toString" o "constructor" no son roles
  return typeof valor === 'string' && Object.prototype.hasOwnProperty.call(INICIO_POR_ROL, valor);
}

/**
 * @param pathname   ruta pedida, p. ej. "/director/cursos"
 * @param rol        rol del token valido, o null si no hay sesion valida
 * @param habiaToken true si llego una cookie de token (aunque sea invalida o vencida)
 */
export function decidirAcceso(pathname: string, rol: string | null | undefined, habiaToken: boolean): DecisionAcceso {
  const rolValido = esRol(rol) ? rol : null;

  if (PUBLICAS.includes(pathname)) {
    // Con sesion iniciada no tiene sentido volver a ver el login
    if (pathname === '/login' && rolValido) {
      return { tipo: 'redirigir', destino: INICIO_POR_ROL[rolValido] };
    }
    return { tipo: 'permitir' };
  }

  if (!rolValido) {
    return { tipo: 'login', sesionExpirada: habiaToken };
  }

  const regla = REGLAS.find((r) => coincide(pathname, r.prefijo));

  // Ruta que no esta en la lista: la deja pasar (Next mostrara su 404 si no existe)
  if (!regla) return { tipo: 'permitir' };

  if (regla.roles.includes(rolValido)) return { tipo: 'permitir' };

  // Rol sin permiso: a su propia pagina de inicio
  return { tipo: 'redirigir', destino: INICIO_POR_ROL[rolValido] };
}
