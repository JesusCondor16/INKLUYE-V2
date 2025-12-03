'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { BibliografiaItem, EvaluacionFila, ModalSeccion4Data } from './ModalSeccion4.model';

export function useModalSeccion4Controller() {
  const { id } = useParams();
  const [estrategia, setEstrategia] = useState('');
  const [recursos, setRecursos] = useState('');
  const [bibliografia, setBibliografia] = useState<BibliografiaItem[]>([]);
  const [matriz, setMatriz] = useState<EvaluacionFila[]>([]);
  const [notaFinalFormula, setNotaFinalFormula] = useState('');
  const [loading, setLoading] = useState(false);

  const maxLength = 1000;

  // 🔹 Cargar datos al montar
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/cursos/${id}/recurso`);
        const data = await res.json();

        setEstrategia(
          (data.estrategiaDidactica ?? []).map((e: any) => e.texto).join('\n\n')
        );

        setRecursos(
          (data.recursos ?? []).map((r: any) => r.descripcion).join('\n\n')
        );

        setBibliografia(
          data.bibliografia?.map((b: any) => ({ id: b.id, texto: b.texto })) ?? []
        );

        const matrizEval: EvaluacionFila[] = data.matrizevaluacion ?? [];
        setMatriz(matrizEval);

        // Generar fórmula literal: "N1 * 30% + N2 * 40% + N3 * 30%"
        const formula = matrizEval
          .map((fila: any) => `${fila.nota_sum} * ${fila.nota_peso}%`)
          .join(' + ');
        setNotaFinalFormula(formula);
      } catch (err) {
        console.error('Error cargando datos del curso:', err);
      }
    };

    fetchData();
  }, [id]);

  // 🔹 Funciones para modificar bibliografía
  const handleChangeBibliografia = (index: number, value: string) => {
    setBibliografia(prev => {
      const newData = [...prev];
      newData[index].texto = value;
      return newData;
    });
  };

  const handleAddBibliografia = () => {
    setBibliografia(prev => [...prev, { texto: '' }]);
  };

  const handleRemoveBibliografia = (index: number) => {
    setBibliografia(prev => prev.filter((_, i) => i !== index));
  };

  const handleGuardarBibliografia = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cursos/${id}/recurso`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bibliografia }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar bibliografía');
      alert('Bibliografía guardada correctamente');
    } catch (err: any) {
      alert('Error: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    estrategia,
    recursos,
    bibliografia,
    matriz,
    notaFinalFormula,
    loading,
    maxLength,
    handleChangeBibliografia,
    handleAddBibliografia,
    handleRemoveBibliografia,
    handleGuardarBibliografia,
  };
}
