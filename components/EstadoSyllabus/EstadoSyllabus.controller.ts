'use client';

import { useCallback, useEffect, useState } from 'react';
import type { EstadoSyllabus, EstadoSyllabusResponse, HistorialSyllabusItem } from './EstadoSyllabus.model';
import type { EnlaceIdioma, EnlaceInclusivo } from '@/components/IdiomasSyllabus/IdiomasSyllabus';

/**
 * Carga el estado e historial del syllabus y permite enviarlo a los docentes.
 * @param cursoId - ID del curso
 * @param recargarKey - cambia cada vez que se genera un PDF nuevo, para volver a consultar el estado
 */
export function useEstadoSyllabusController(cursoId: number, recargarKey: number) {
  const [estado, setEstado] = useState<EstadoSyllabus | null>(null);
  const [historial, setHistorial] = useState<HistorialSyllabusItem[]>([]);
  const [idiomas, setIdiomas] = useState<EnlaceIdioma[]>([]);
  const [inclusivo, setInclusivo] = useState<EnlaceInclusivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/cursos/${cursoId}/syllabus-flujo`, { credentials: 'include' });
      const data = (await res.json()) as EstadoSyllabusResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se pudo cargar el estado del syllabus');
      setEstado(data.estado);
      setHistorial(data.historial);
      setIdiomas(data.idiomas ?? []);
      setInclusivo(data.inclusivo ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el estado del syllabus');
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    if (!cursoId) return;
    cargar();
  }, [cursoId, recargarKey, cargar]);

  const enviarADocentes = useCallback(async () => {
    setEnviando(true);
    setMensaje('');
    setError('');
    try {
      const res = await fetch(`/api/cursos/${cursoId}/syllabus-flujo`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'ENVIAR' }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'No se pudo enviar el syllabus');
      setMensaje('Syllabus enviado a los docentes del curso para su revisión.');
      await cargar();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el syllabus');
    } finally {
      setEnviando(false);
    }
  }, [cursoId, cargar]);

  return { estado, historial, idiomas, inclusivo, loading, enviando, mensaje, error, enviarADocentes };
}
