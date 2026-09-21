// useSyllabusController.tsx
'use client';
import { useState, useCallback } from 'react';
import { generarPDF } from './pdfGenerator'; // ajustar ruta si hace falta
import { SyllabusLang } from '@/lib/i18n/syllabusLabels';

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

// Forma parcialmente conocida: el código solo lee el campo declarado, pero preserva
// cualquier otro campo que venga del servidor sin necesidad de enumerarlo.
interface Competencia {
  descripcion?: string;
  [key: string]: unknown;
}

interface Logro {
  descripcion?: string;
  [key: string]: unknown;
}

interface Recurso {
  descripcion?: string;
  [key: string]: unknown;
}

interface Bibliografia {
  texto?: string;
  [key: string]: unknown;
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
  coordinador?: unknown;
  competencias?: Competencia[];
  logros?: Logro[];
  logro?: Logro[]; // nombre usado por Prisma; se normaliza a 'logros' en loadCurso
  matriz?: unknown[];
  bibliografia?: Bibliografia[];
  estrategia?: unknown[];
  recursos?: Recurso[];
  prerequisites?: unknown[];
  cursodocente?: unknown[];
  capacidad?: Capacidad[]; // prisma name
  capacidades?: Capacidad[]; // alternative
  programacion?: Programacion[]; // programación de contenidos
  programacioncontenido?: Programacion[]; // alternative
  estrategias?: Estrategia[]; // agregado: nombre genérico
  estrategiasdidacticas?: Estrategia[]; // agregado: coincidir con prisma
}

class TranslateNotConfiguredError extends Error {
  readonly code = 'NOT_CONFIGURED' as const;
  constructor(message: string) {
    super(message);
    this.name = 'TranslateNotConfiguredError';
  }
}

/**
 * Llama a /api/translate para traducir un lote de textos.
 * Lanza TranslateNotConfiguredError si la API key todavía no está puesta en el servidor.
 */
async function traducirTextos(texts: string[], targetLang: 'en' | 'zh'): Promise<string[]> {
  const res = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ texts, targetLang }),
  });

  if (res.status === 503) {
    throw new TranslateNotConfiguredError('Traducción no configurada');
  }

  if (!res.ok) {
    throw new Error(`Error al traducir (HTTP ${res.status})`);
  }

  const json = await res.json();
  return (json.translated as string[]) ?? [];
}

/**
 * Junta todo el texto libre traducible del curso en un solo lote (una sola llamada a la API),
 * y reconstruye copias traducidas de curso/capacidades/programacion en el mismo orden en que se enviaron.
 * Los identificadores (nombre de curso, código, nombres de docentes) NO se traducen a propósito.
 */
async function construirCursoTraducido(
  curso: Curso,
  capacidades: Capacidad[],
  programacion: Programacion[],
  estrategias: Estrategia[],
  targetLang: 'en' | 'zh'
) {
  const competencias = curso.competencias ?? [];
  const logros = curso.logros ?? curso.logro ?? [];
  const recursos = curso.recursos ?? [];
  const bibliografia = curso.bibliografia ?? [];

  const textos: string[] = [];
  textos.push(curso.sumilla ?? '');
  for (const c of competencias) textos.push(c.descripcion ?? '');
  for (const l of logros) textos.push(l.descripcion ?? '');
  for (const c of capacidades) textos.push(c.descripcion ?? '');
  for (const p of programacion) {
    textos.push(p.contenido ?? '');
    textos.push(p.actividades ?? '');
    textos.push(p.recursos ?? '');
  }
  for (const e of estrategias) textos.push(e.texto ?? '');
  for (const r of recursos) textos.push(r.descripcion ?? '');
  for (const b of bibliografia) textos.push(b.texto ?? '');

  const traducidos = await traducirTextos(textos, targetLang);
  let i = 0;
  const next = () => traducidos[i++] ?? '';

  const sumillaTraducida = next();
  const competenciasTraducidas = competencias.map((c) => ({ ...c, descripcion: next() }));
  const logrosTraducidos = logros.map((l) => ({ ...l, descripcion: next() }));
  const capacidadesTraducidas = capacidades.map((c) => ({ ...c, descripcion: next() }));
  const programacionTraducida = programacion.map((p) => ({
    ...p,
    contenido: next(),
    actividades: next(),
    recursos: next(),
  }));
  const estrategiasTraducidas = estrategias.map((e) => ({ ...e, texto: next() }));
  const recursosTraducidos = recursos.map((r) => ({ ...r, descripcion: next() }));
  const bibliografiaTraducida = bibliografia.map((b) => ({ ...b, texto: next() }));

  const cursoTraducido: Curso = {
    ...curso,
    sumilla: sumillaTraducida,
    competencias: competenciasTraducidas,
    logros: logrosTraducidos,
    logro: logrosTraducidos,
    capacidad: capacidadesTraducidas,
    capacidades: capacidadesTraducidas,
    programacion: programacionTraducida,
    programacioncontenido: programacionTraducida,
    estrategias: estrategiasTraducidas,
    estrategiasdidacticas: estrategiasTraducidas,
    recursos: recursosTraducidos,
    bibliografia: bibliografiaTraducida,
  };

  return {
    curso: cursoTraducido,
    capacidades: capacidadesTraducidas,
    programacion: programacionTraducida,
  };
}

/**
 * useSyllabusController
 * - loadCurso(cursoId) carga datos desde /api/cursos/:id/generarSyllabus
 * - generarPDF(lang) traduce (si lang !== 'es') y genera el PDF, subiéndolo al servidor
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

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setCurso(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ======================================================
  // GENERAR PDF (USANDO generarPDF)
  // ======================================================
  const generarPDFController = useCallback(async (lang: SyllabusLang = 'es') => {
    if (!curso) return;
    setGenerating(true);
    setError(null);

    try {
      let capacidades = curso.capacidad ?? curso.capacidades ?? [];
      let programacion = curso.programacion ?? curso.programacioncontenido ?? [];
      const estrategias = curso.estrategias ?? curso.estrategiasdidacticas ?? [];

      let cursoParaPdf: Curso = curso;
      let langFinal: SyllabusLang = lang;

      if (lang !== 'es') {
        try {
          const traducido = await construirCursoTraducido(curso, capacidades, programacion, estrategias, lang);
          cursoParaPdf = traducido.curso;
          capacidades = traducido.capacidades;
          programacion = traducido.programacion;
        } catch (err: unknown) {
          if (err instanceof TranslateNotConfiguredError) {
            alert('La traducción automática todavía no está configurada (falta la API key). Se generará el syllabus en español.');
          } else {
            console.error('Error traduciendo syllabus:', err);
            alert('No se pudo traducir el syllabus. Se generará en español.');
          }
          cursoParaPdf = curso;
          langFinal = 'es';
        }
      }

      // Depuración antes de generar
      // eslint-disable-next-line no-console
      console.log('generarPDFController - curso.id:', cursoParaPdf.id, '| lang:', langFinal);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - competencias:', (cursoParaPdf.competencias ?? []).length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - logros:', (cursoParaPdf.logros ?? cursoParaPdf.logro ?? []).length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - capacidades:', capacidades.length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - programacion:', programacion.length);
      // eslint-disable-next-line no-console
      console.log('generarPDFController - estrategias:', estrategias.length);

      return await generarPDF(
        cursoParaPdf,
        cursoParaPdf.competencias ?? [],
        cursoParaPdf.logros ?? cursoParaPdf.logro ?? [],
        capacidades,
        programacion,
        langFinal,
        { uploadToServer: true },
      );
    } catch (err: unknown) {
      console.error('Error generando PDF:', err);
      setError(err instanceof Error ? err.message : 'Error al generar PDF');
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