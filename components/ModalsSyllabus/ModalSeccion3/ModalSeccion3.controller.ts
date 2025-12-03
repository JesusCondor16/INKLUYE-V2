'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { Capacidad, Programacion, Fila } from './ModalSeccion3.model';

export function useModalSeccion3Controller() {
  const params = useParams() as { id?: string } | null;
  const cursoId = params?.id;
  const [capacidades, setCapacidades] = useState<Capacidad[]>([]);
  const [programaciones, setProgramaciones] = useState<Programacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!cursoId) {
      setCapacidades([]);
      setProgramaciones([]);
      setLoading(false);
      return;
    }

    const ac = new AbortController();
    const signal = ac.signal;

    async function fetchCapacidades() {
      setLoading(true);
      try {
        const res = await fetch(`/api/cursos/${cursoId}/capacidades`, { signal });
        if (!res.ok) throw new Error('Error al cargar capacidades del curso');

        const data = await res.json();

        // Normalización de datos
        const capsArray: Capacidad[] = Array.isArray(data.capacidades)
          ? data.capacidades
          : Array.isArray(data)
          ? data
          : [];

        const inicialCapacidades: Capacidad[] = capsArray.length > 0 ? capsArray : [{ nombre: '', descripcion: '' }];

        const inicialProgramaciones: Programacion[] = inicialCapacidades.map((unidad) => {
          const filasRaw = unidad.filas ?? [];
          const filas: Fila[] =
            filasRaw.length > 0
              ? filasRaw.map((fila: Partial<Fila>) => ({
                  semana: fila.semana ?? '',
                  contenido: fila.contenido ?? '',
                  actividades: fila.actividades ?? '',
                  recursos: fila.recursos ?? '',
                  estrategias: fila.estrategias ?? '',
                  fixed: fila.fixed ?? false,
                }))
              : Array.from({ length: 4 }).map(() => ({
                  semana: '',
                  contenido: '',
                  actividades: '',
                  recursos: '',
                  estrategias: '',
                  fixed: false,
                }));

          return {
            logroUnidad: unidad.logro ?? '',
            filas,
          };
        });

        setCapacidades(inicialCapacidades);
        setProgramaciones(inicialProgramaciones);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error cargando capacidades:', err);
          setCapacidades([]);
          setProgramaciones([]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCapacidades();
    return () => ac.abort();
  }, [cursoId]);

  return { loading, capacidades, programaciones };
}
