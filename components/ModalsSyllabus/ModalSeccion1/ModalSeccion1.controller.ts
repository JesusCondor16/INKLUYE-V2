'use client';

import { useEffect, useRef, useState } from 'react';
import { Curso } from './ModalSeccion1.model';

export function useModalSeccion1Controller(cursoId: number) {
  const [curso, setCurso] = useState<Curso | null>(null);
  const [sumilla, setSumilla] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!cursoId) return;

    const fetchCurso = async () => {
      setLoading(true);

      try {
        const res = await fetch(`/api/cursos/${cursoId}`);

        if (!res.ok) {
          throw new Error('Error al obtener los datos del curso');
        }

        const data: Curso = await res.json();

        // Asegurar estructura de coordinador
        if (data.coordinador) {
          const coord = data.coordinador as any;

          data.coordinador = {
            id: coord.id ?? 0,
            name: coord.name ?? '',
            email: coord.email ?? '',
            role: coord.role ?? 'coordinador',
          };
        }

        // Asegurar estructura de docentes
        data.cursoDocentes = data.cursoDocentes?.map(cd => ({
          user: {
            id: cd.user?.id ?? 0,
            name: cd.user?.name ?? '',
            email: cd.user?.email ?? '',
            role: cd.user?.role ?? 'docente',
          },
        }));

        setCurso(data);
        setSumilla(data.sumilla || '');

      } catch (error) {
        console.error('❌ Error al cargar el curso:', error);
        alert('Error al cargar datos del curso');
      } finally {
        setLoading(false);
      }
    };

    fetchCurso();

  }, [cursoId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  return {
    curso,
    sumilla,
    loading,
    textareaRef,
  };
}