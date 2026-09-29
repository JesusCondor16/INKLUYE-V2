'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SyllabusPendiente } from './RevisionSyllabus.model';

/** Lista los syllabus por revisar y permite publicarlos o devolverlos con observaciones. */
export function useRevisionSyllabusController() {
  const [pendientes, setPendientes] = useState<SyllabusPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/syllabus/por-revisar', { credentials: 'include' });
      const data = (await res.json()) as SyllabusPendiente[] | { error?: string };
      if (!res.ok || !Array.isArray(data)) {
        throw new Error(!Array.isArray(data) && data.error ? data.error : 'No se pudo cargar la lista');
      }
      setPendientes(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Devuelve true si la accion se aplico, para que la vista pueda cerrar el modal
  const ejecutar = useCallback(
    async (curso: SyllabusPendiente, accion: 'PUBLICAR' | 'DEVOLVER', observacion?: string) => {
      setProcesandoId(curso.id);
      setMensaje('');
      setError('');
      try {
        const res = await fetch(`/api/cursos/${curso.id}/syllabus-flujo`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accion, observacion }),
        });
        const data = (await res.json()) as { error?: string };
        if (!res.ok) throw new Error(data.error ?? 'No se pudo completar la acción');

        setMensaje(
          accion === 'PUBLICAR'
            ? `Syllabus de ${curso.name} publicado. Los estudiantes ya pueden verlo.`
            : `Syllabus de ${curso.name} devuelto al coordinador con tus observaciones.`,
        );
        await cargar();
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'No se pudo completar la acción');
        return false;
      } finally {
        setProcesandoId(null);
      }
    },
    [cargar],
  );

  const publicar = useCallback((curso: SyllabusPendiente) => ejecutar(curso, 'PUBLICAR'), [ejecutar]);
  const devolver = useCallback(
    (curso: SyllabusPendiente, observacion: string) => ejecutar(curso, 'DEVOLVER', observacion),
    [ejecutar],
  );

  return { pendientes, loading, procesandoId, mensaje, error, publicar, devolver };
}
