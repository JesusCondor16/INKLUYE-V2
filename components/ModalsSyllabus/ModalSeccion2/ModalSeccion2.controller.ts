'use client';

import { useState, useEffect } from 'react';
import { Competencia, Logro } from './ModalSeccion2.model';

export function useModalSeccion2Controller(cursoId: number) {
  const [competenciasCurso, setCompetenciasCurso] = useState<Competencia[]>([]);
  const [competenciasGlobales, setCompetenciasGlobales] = useState<Competencia[]>([]);
  const [logros, setLogros] = useState<Logro[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar competencias globales
  useEffect(() => {
    const cargarGlobales = async () => {
      try {
        const res = await fetch('/api/competencias');
        if (!res.ok) throw new Error('Error al cargar competencias globales');
        const data: Competencia[] = await res.json();
        setCompetenciasGlobales(data);
      } catch (error) {
        console.error('❌ Error cargando competencias globales:', error);
      }
    };
    cargarGlobales();
  }, []);

  // 🔹 Cargar competencias y logros del curso
  useEffect(() => {
    if (!cursoId) return;
    const cargarCurso = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cursos/${cursoId}/competencias`);
        if (!res.ok) throw new Error('No se pudieron cargar competencias del curso');
        const data = await res.json();
        setCompetenciasCurso(data.competencias ?? []);
        setLogros(data.logros ?? []);
      } catch (error) {
        console.error('❌ Error cargando competencias/logros del curso:', error);
      } finally {
        setLoading(false);
      }
    };
    cargarCurso();
  }, [cursoId]);

  return {
    competenciasCurso,
    competenciasGlobales,
    logros,
    loading,
  };
}
