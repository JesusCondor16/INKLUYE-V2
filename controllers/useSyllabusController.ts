// useSyllabusController.tsx
'use client';
import { useState, useCallback } from 'react';
import { generarPDF } from './pdfGenerator'; // ajustar ruta si hace falta

interface Capacidad {
  id: number;
  nombre: string;
  descripcion: string;
  cursoId?: number;
}

interface Programacion {
  id?: number;
  logroUnidad?: string;
  semana?: string;
  contenido?: string;
  actividades?: string;
  recursos?: string;
  estrategias?: string;
  capacidadId?: number;
}

interface Estrategia {
  id?: number;
  texto?: string;
  createdAt?: string;
  updatedAt?: string;
  cursoId?: number;
}

interface Curso {
  id: number;
  code: string;
  name: string;
  credits?: number;
  type?: string;
  area?: string;
  weeks?: number;
  hours?: number;
  semester?: string;
  cycle?: string;
  mode?: string;
  group?: string;
  sumilla?: string;
  coordinador?: any;
  competencias?: any[];
  logros?: any[];
  matriz?: any[];
  bibliografia?: any[];
  estrategia?: any[];
  recursos?: any[];
  prerequisites?: any[];
  cursodocente?: any[];
  capacidad?: Capacidad[]; // prisma name
  capacidades?: Capacidad[]; // alternative
  programacion?: Programacion[]; // programación de contenidos
  programacioncontenido?: Programacion[]; // alternative
  estrategias?: Estrategia[]; // agregado: nombre genérico
  estrategiasdidacticas?: Estrategia[]; // agregado: coincidir con prisma
}

/**
 * useSyllabusController
 * - loadCurso(cursoId) carga datos desde /api/cursos/:id/generarSyllabus
 * - generarPDF usa generarPDF(...) pasando capacidades, programacion y estrategias explícitamente
 */
export function useSyllabusController() {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // ======================================================
  // CARGAR CURSO
  // ======================================================
  const loadCurso = useCallback(async (cursoId: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/cursos/${cursoId}/generarSyllabus`);
      if (res.status === 401) throw new Error('⚠️ No autorizado. Token inválido o expirado');

      // Si el endpoint devuelve PDF directo, abrimos el blob
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        try {
          const j = JSON.parse(txt);
          throw new Error(j?.error || j?.message || `HTTP ${res.status}`);
        } catch {
          throw new Error(txt || `HTTP ${res.status}`);
        }
      }

      const data = await res.json();

      // Detectar capacidades en variantes posibles
      const capacidadesFromResponse: Capacidad[] =
        (Array.isArray(data.capacidades) && data.capacidades.length) ? data.capacidades
          : (Array.isArray(data.capacidad) && data.capacidad.length) ? data.capacidad
          : (Array.isArray(data.curso?.capacidad) && data.curso.capacidad.length) ? data.curso.capacidad
          : (Array.isArray(data.curso?.capacidades) && data.curso.capacidades.length) ? data.curso.capacidades
          : [];

      // Detectar programacion en variantes posibles
      const programacionFromResponse: Programacion[] =
        (Array.isArray(data.programacion) && data.programacion.length) ? data.programacion
          : (Array.isArray(data.programacioncontenido) && data.programacioncontenido.length) ? data.programacioncontenido
          : (Array.isArray(data.curso?.programacion) && data.curso.programacion.length) ? data.curso.programacion
          : (Array.isArray(data.curso?.programacioncontenido) && data.curso.programacioncontenido.length) ? data.curso.programacioncontenido
          : [];

      // Detectar estrategias didácticas (varias posibles claves)
      const estrategiasFromResponse: Estrategia[] =
        (Array.isArray(data.estrategias) && data.estrategias.length) ? data.estrategias
          : (Array.isArray(data.estrategia) && data.estrategia.length) ? data.estrategia
          : (Array.isArray(data.estrategiasdidacticas) && data.estrategiasdidacticas.length) ? data.estrategiasdidacticas
          : (Array.isArray(data.estrategiasDidacticas) && data.estrategiasDidacticas.length) ? data.estrategiasDidacticas
          : (Array.isArray(data.curso?.estrategias) && data.curso.estrategias.length) ? data.curso.estrategias
          : (Array.isArray(data.curso?.estrategia) && data.curso.estrategia.length) ? data.curso.estrategia
          : (Array.isArray(data.curso?.estrategiasdidacticas) && data.curso.estrategiasdidacticas.length) ? data.curso.estrategiasdidacticas
          : [];

      const cursoObj = data.curso ?? data;

      setCurso({
        ...cursoObj,
        competencias: data.competencias ?? cursoObj.competencia ?? [],
        logros: data.logros ?? cursoObj.logro ?? [],
        matriz: data.matriz ?? [],
        bibliografia: data.bibliografia ?? [],
        estrategia: data.estrategia ?? [],
        recursos: data.recursos ?? [],
        prerequisites: data.prerequisites ?? [],
        cursodocente: data.cursodocente ?? cursoObj.cursodocente ?? [],
        capacidad: capacidadesFromResponse,
        capacidades: capacidadesFromResponse,
        programacion: programacionFromResponse,
        programacioncontenido: programacionFromResponse,
        estrategias: estrategiasFromResponse,
        estrategiasdidacticas: estrategiasFromResponse,
      });

      // Debug: mostrar conteos
      // eslint-disable-next-line no-console
      console.log('loadCurso - capacidades detectadas:', capacidadesFromResponse.length, capacidadesFromResponse);
      // eslint-disable-next-line no-console
      console.log('loadCurso - programacion detectada:', programacionFromResponse.length, programacionFromResponse);
      // eslint-disable-next-line no-console
      console.log('loadCurso - estrategias detectadas:', estrategiasFromResponse.length, estrategiasFromResponse);

    } catch (err: any) {
      setError(err.message ?? 'Error desconocido');
      setCurso(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================================================
  // GENERAR PDF (USANDO generarPDF)
  // ======================================================
  const generarPDFController = useCallback(async () => {
    if (!curso) return;
    setGenerating(true);
    setError(null);

    try {
      const capacidades = curso.capacidad ?? curso.capacidades ?? [];
      const programacion = curso.programacion ?? curso.programacioncontenido ?? [];
      const estrategias = curso.estrategias ?? curso.estrategiasdidacticas ?? [];

      // Depuración antes de generar
      // eslint-disable-next-line no-console
      console.log('generarPDFController - curso.id:', curso.id);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - competencias:', (curso.competencias ?? []).length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - logros:', (curso.logros ?? curso.logro ?? []).length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - capacidades:', capacidades.length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - programacion:', programacion.length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - estrategias:', estrategias.length);

      // Llamada al generador: le pasamos programacion como 5º argumento y estrategias como 6º
      // Nota: asegúrate de actualizar la firma de generarPDF si actualmente no acepta este argumento.
      await generarPDF(
        curso,
        curso.competencias ?? [],
        curso.logros ?? curso.logro ?? [],
        capacidades,
        programacion,
        estrategias,
      );
    } catch (err: any) {
      console.error('Error generando PDF:', err);
      setError(err?.message ?? 'Error al generar PDF');
    } finally {
      setGenerating(false);
    }
  }, [curso]);

  return {
    curso,
    loading,
    error,
    loadCurso,
    generarPDF: generarPDFController,
    generating,
  };
}
