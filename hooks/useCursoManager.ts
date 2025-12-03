// src/hooks/useCursoManager.ts
import { useEffect, useState } from 'react';

export interface User {
  id: number;
  name: string;
  email?: string | null;
}

export interface CursoDocente {
  user?: User;
  userId?: number;
}

export interface Curso {
  id: number;
  code: string;
  name: string;
  credits?: number | null;
  type?: string | null;
  area?: string | null;
  weeks?: number | null;
  theoryHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  semester?: string | null;
  cycle?: string | null;
  modality?: string | null;
  group?: string | null;
  sumilla?: string | null;
  user?: User | null; // coordinador
  docentes?: User[]; // normalized array of users (for easy UI use)
  cursodocente?: CursoDocente[]; // raw relation as returned by API
  logro?: any[]; // optional
  // any other fields allowed
  [key: string]: any;
}

/** Payload parcial que viene desde el Modal (vista) */
export type ModalSavePayload = {
  semester?: string | null;
  coordinadorId?: number | null;
  docentesIds?: number[]; // array de user ids
  // si quieres otros campos editables, añádelos aquí
};

export type UseCursoManagerReturn = {
  cursos: Curso[];
  coordinadores: User[];
  docentesOptions: User[];
  cargando: boolean;
  isSaving: boolean;
  alerta: string;
  setAlerta: (s: string) => void;
  fetchCursos: () => Promise<void>;
  fetchOptions: () => Promise<void>;
  actualizarCursoEnApi: (cursoId: number, payload: ModalSavePayload) => Promise<{ ok: boolean; curso?: Curso; error?: string }>;
};

/**
 * useCursoManager
 * - fetchCursos -> obtiene lista /api/cursos
 * - fetchOptions -> obtiene coordinadores y docentes (endpoints separados esperados)
 * - actualizarCursoEnApi -> arma body, llama PUT /api/cursos/:id, actualiza estado local
 */
export function useCursoManager(): UseCursoManagerReturn {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [coordinadores, setCoordinadores] = useState<User[]>([]);
  const [docentesOptions, setDocentesOptions] = useState<User[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [alerta, setAlerta] = useState<string>('');

  // Fetch cursos al montar
  useEffect(() => {
    fetchCursos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchCursos() {
    setCargando(true);
    try {
      const res = await fetch('/api/cursos');
      if (!res.ok) throw new Error('Error al obtener cursos');
      const data = (await res.json()) as Curso[];
      setCursos(normalizeCursosArray(data));
    } catch (err) {
      console.error('fetchCursos error:', err);
      setAlerta('Error al cargar cursos');
    } finally {
      setCargando(false);
    }
  }

  async function fetchOptions() {
    // Carga coordinadores y docentes para selects del modal.
    // Ajusta las rutas si tus endpoints cambian.
    try {
      const [resCoords, resDocs] = await Promise.all([
        fetch('/api/coordinadores'),
        fetch('/api/docentes'),
      ]);

      if (!resCoords.ok) throw new Error('Error al obtener coordinadores');
      if (!resDocs.ok) throw new Error('Error al obtener docentes');

      const coords = (await resCoords.json()) as User[];
      const docs = (await resDocs.json()) as User[];

      setCoordinadores(coords ?? []);
      setDocentesOptions(docs ?? []);
    } catch (err) {
      console.error('fetchOptions error:', err);
      setAlerta('Error al cargar opciones (coordinadores o docentes)');
    }
  }

  /**
   * actualizarCursoEnApi
   * - arma un body mínimo a partir del payload (no sobrescribe campos que no se envían)
   * - llama PUT /api/cursos/:id
   * - actualiza estado local de cursos con la respuesta del servidor (si la API devuelve el curso)
   */
  async function actualizarCursoEnApi(cursoId: number, payload: ModalSavePayload) {
    setIsSaving(true);
    try {
      // Validaciones mínimas (puedes extender según reglas del servidor)
      if (payload.coordinadorId == null) {
        return { ok: false, error: 'Se requiere seleccionar un coordinador' };
      }

      // Construir body que tu API espera (según tu PUT server)
      const body: any = {
        // por seguridad, envía al menos code/name si tu API los requiere.
        // Si tu API no requiere code/name para actualizar, omítelos.
        // Aquí asumimos que la API actual permite actualizar parcialmente:
        semester: payload.semester ?? undefined,
        coordinadorId: payload.coordinadorId ?? undefined,
        docentes: Array.isArray(payload.docentesIds) ? payload.docentesIds : undefined,
        // logros u otros campos pueden añadirse si vienen del modal
      };

      // Limpiar undefined keys
      Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);

      const res = await fetch(`/api/cursos/${cursoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errJson = await safeJson(res);
        const msg = errJson?.error ?? 'Error al actualizar curso';
        setAlerta(msg);
        return { ok: false, error: msg };
      }

      const json = await res.json();
      // tu API devuelve { message, curso } según lo vimos antes; soportamos ambas posibilidades
      const updatedCurso: Curso | undefined = (json.curso ?? json) as Curso;

      if (updatedCurso) {
        setCursos((prev) => prev.map((c) => (c.id === updatedCurso.id ? normalizeCurso(updatedCurso) : c)));
        setAlerta('Curso actualizado correctamente');
        setTimeout(() => setAlerta(''), 4000);
        return { ok: true, curso: updatedCurso };
      } else {
        // Si la API no devuelve curso, actualizamos menos agresivamente: refetch
        await fetchCursos();
        setAlerta('Curso actualizado correctamente');
        setTimeout(() => setAlerta(''), 4000);
        return { ok: true };
      }
    } catch (err) {
      console.error('actualizarCursoEnApi error:', err);
      const message = (err as any)?.message ?? 'Error inesperado al actualizar';
      setAlerta(message);
      return { ok: false, error: message };
    } finally {
      setIsSaving(false);
    }
  }

  return {
    cursos,
    coordinadores,
    docentesOptions,
    cargando,
    isSaving,
    alerta,
    setAlerta,
    fetchCursos,
    fetchOptions,
    actualizarCursoEnApi,
  };
}

/* ---------- Helpers ---------- */

/** Normaliza cada curso (asegura campos docentes como array de users) */
function normalizeCurso(c: any): Curso {
  // Normaliza cursodocente -> docentes (array of users)
  const rawCursodocente = Array.isArray(c.cursodocente) ? c.cursodocente : [];
  const docentes: User[] = [];

  rawCursodocente.forEach((cd: any) => {
    if (cd.user) {
      docentes.push({ id: cd.user.id, name: cd.user.name, email: cd.user.email ?? null });
    } else if (cd.userId) {
      // si solo hay userId, lo mantenemos como id con nombre vacío (puedes refetch luego)
      docentes.push({ id: cd.userId, name: (cd.user?.name ?? ''), email: cd.user?.email ?? null });
    }
  });

  const coordinador = c.user ? { id: c.user.id, name: c.user.name, email: c.user.email ?? null } : null;

  return {
    ...c,
    docentes,
    user: coordinador,
    cursodocente: rawCursodocente,
  };
}

/** Normaliza un array entero */
function normalizeCursosArray(arr: any[]): Curso[] {
  return (arr ?? []).map(normalizeCurso);
}

/** safeJson: intenta parsear JSON del response sin lanzar */
async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
