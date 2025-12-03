// services/cursoService.ts

export type Docente = {
  id: number;
  name: string;
  email: string;
};

export type Curso = {
  id: number;
  code: string;
  name: string;
  type?: string;
  cycle?: string | null;
  credits?: number;
  modality?: string | null;
  coordinador?: { id: number; name: string; email: string } | null;
  docentes?: Docente[];
};

/** Resultado cuando fetchSyllabusData devuelve PDF o JSON */
export type SyllabusFetchResult =
  | { type: 'pdf'; blob: Blob }
  | { type: 'json'; json: any };

function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

async function rawFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data, res };
}

/**
 * fetchCursosFromApi
 * - Intenta primero /api/cursos sin header (si usás session server-side)
 * - Si la API responde "ID no proporcionado" reintenta leyendo cookie/localStorage
 * - Normaliza 3 posibles shapes: array | { cursos: [] } | single object
 */
export async function fetchCursosFromApi(): Promise<Curso[]> {
  // 1) primer intento (sin header)
  let result = await rawFetch('/api/cursos', { method: 'GET' });

  // 2) si backend pidió ID, intentar con cookie/localStorage
  if (!result.ok && result.data && (result.data.error === 'ID no proporcionado')) {
    const cookieUserId = getCookieValue('userId');
    const lsUserId = typeof window !== 'undefined' ? window.localStorage.getItem('userId') : null;
    const fallback = cookieUserId ?? lsUserId ?? null;

    if (fallback) {
      result = await rawFetch('/api/cursos', {
        method: 'GET',
        headers: { 'x-user-id': String(fallback) },
      });
    }
  }

  // 3) si sigue fallando, lanzar error con mensaje del servidor
  if (!result.ok) {
    const msg = result.data?.error || result.data?.detalle || `HTTP ${result.status}`;
    throw new Error(msg);
  }

  // 4) normalizar respuesta
  const raw = result.data;
  let arr: any[] = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw?.cursos)) arr = raw.cursos;
  else if (raw && typeof raw === 'object' && raw.id != null) arr = [raw];
  else arr = [];

  const normalized: Curso[] = arr.map((c: any) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    type: c.type,
    cycle: c.cycle ?? c.semester ?? null,
    credits: c.credits,
    modality: c.modality,
    coordinador: c.coordinador ?? c.user ?? null,
    docentes:
      Array.isArray(c.docentes)
        ? c.docentes
        : Array.isArray(c.cursodocente)
        ? c.cursodocente.map((cd: any) => cd.user).filter(Boolean)
        : Array.isArray(c.cursoDocentes)
        ? c.cursoDocentes.map((cd: any) => cd.user).filter(Boolean)
        : [],
  }));

  return normalized;
}

/**
 * fetchCurso
 * - Trae un curso por id desde /api/cursos/:id
 * - Normaliza el resultado (devuelve el JSON tal cual normalmente)
 */
export async function fetchCurso(cursoId: number) {
  if (!Number.isInteger(cursoId) || cursoId <= 0) throw new Error('cursoId inválido');
  const result = await rawFetch(`/api/cursos/${cursoId}`, { method: 'GET' });
  if (!result.ok) {
    const msg = result.data?.error || result.data?.detalle || `HTTP ${result.status}`;
    throw new Error(msg);
  }
  return result.data;
}

/**
 * fetchSyllabusData
 * - Llama a /api/cursos/:id/generarSyllabus?lang=...
 * - Si el servidor responde application/pdf devuelve { type: 'pdf', blob }
 * - Si el servidor responde JSON devuelve { type: 'json', json }
 */
export async function fetchSyllabusData(cursoId: number, lang = 'es'): Promise<SyllabusFetchResult> {
  if (!Number.isInteger(cursoId) || cursoId <= 0) throw new Error('cursoId inválido');

  const url = `/api/cursos/${cursoId}/generarSyllabus?lang=${encodeURIComponent(lang)}`;
  const res = await fetch(url, { method: 'GET', credentials: 'include' });

  if (!res.ok) {
    // intentar extraer JSON o texto con detalle del error
    const txt = await res.text().catch(() => '');
    try {
      const json = JSON.parse(txt);
      const msg = json?.error || json?.message || JSON.stringify(json);
      throw new Error(msg || `HTTP ${res.status}`);
    } catch {
      throw new Error(txt || `HTTP ${res.status}`);
    }
  }

  const contentType = (res.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/pdf')) {
    const blob = await res.blob();
    return { type: 'pdf', blob };
  }

  // si no es PDF, asumir JSON con los datos para construir el syllabus en cliente
  const json = await res.json().catch(() => null);
  return { type: 'json', json };
}

export default fetchCursosFromApi;
