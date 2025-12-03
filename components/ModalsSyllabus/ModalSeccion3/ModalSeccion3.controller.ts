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

        const data: unknown = await res.json();

        // Normalización de datos con type guard
        let capsArray: Capacidad[] = [];
        if (Array.isArray(data)) {
          capsArray = data as Capacidad[];
        } else if (data && typeof data === 'object' && 'capacidades' in data && Array.isArray((data as any).capacidades)) {
          capsArray = (data as { capacidades: Capacidad[] }).capacidades;
        }

        const inicialCapacidades: Capacidad[] = capsArray.length > 0 ? capsArray : [{ nombre: '', descripcion: '' }];

        const inicialProgramaciones: Programacion[] = inicialCapacidades.map((unidad) => {
          const filasRaw = Array.isArray(unidad.filas) ? unidad.filas : [];
          const filas: Fila[] =
            filasRaw.length > 0
              ? filasRaw.map((fila: unknown) => {
                  const f = fila as Partial<Fila>;
                  return {
                    semana: f.semana ?? '',
                    contenido: f.contenido ?? '',
                    actividades: f.actividades ?? '',
                    recursos: f.recursos ?? '',
                    estrategias: f.estrategias ?? '',
                    fixed: f.fixed ?? false,
                  };
                })
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
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Error desconocido');
        if (error.name !== 'AbortError') {
          console.error('Error cargando capacidades:', error);
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
