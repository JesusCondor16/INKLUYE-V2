export interface UsuarioSesion {
  id: number;
  name: string;
  email: string;
  role: string;
}

export type ResultadoPerfil =
  | { estado: 'activa'; user: UsuarioSesion; expiraEn: number | null }
  | { estado: 'sin-sesion' }
  | { estado: 'error'; error: string };

// El navegador envia solo la cookie httpOnly: ya no se lee el token desde localStorage
export async function getPerfil(): Promise<ResultadoPerfil> {
  try {
    const res = await fetch('/api/perfil', { cache: 'no-store' });

    // 401 = no hay sesion o el token expiro (no es un error del sistema)
    if (res.status === 401) return { estado: 'sin-sesion' };

    const data = await res.json();
    if (!res.ok) return { estado: 'error', error: data.error ?? 'Error al obtener perfil' };

    return { estado: 'activa', user: data.user, expiraEn: data.expiraEn ?? null };
  } catch {
    return { estado: 'error', error: 'Error al obtener perfil' };
  }
}
