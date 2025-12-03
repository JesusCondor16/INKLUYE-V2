// src/hooks/useCursos.ts
import { useEffect, useState } from 'react';

export interface User {
  id: number;
  name: string;
  email?: string | null;
}

export interface CursoDocente {
  user: User;
  // si tienes otros campos, añádelos aquí
}

export interface Curso {
  id: number;
  code: string;
  name: string;
  credits?: number | null;
  type?: string | null;
  user?: User | null; // coordinador
  cursodocente: CursoDocente[];
  // campos opcionales que traes desde la API
  [key: string]: any;
}

export function useCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [alerta, setAlerta] = useState<string>('');
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    async function fetchCursos() {
      try {
        const res = await fetch('/api/cursos');
        if (!res.ok) throw new Error('Error al obtener cursos');
        const data = (await res.json()) as Curso[];
        if (mounted) setCursos(data);
      } catch (err) {
        console.error(err);
        if (mounted) setAlerta('Error al cargar cursos');
      } finally {
        if (mounted) setCargando(false);
      }
    }
    fetchCursos();
    return () => { mounted = false; };
  }, []);

  return { cursos, alerta, setAlerta, cargando, setCursos };
}
