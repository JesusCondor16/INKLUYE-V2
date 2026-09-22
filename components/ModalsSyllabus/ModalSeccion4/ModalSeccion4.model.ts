// app/components/ModalsSyllabus/ModalSeccion4/ModalSeccion4.model.ts

import type { BibliografiaCategoria } from '@prisma/client';

export interface BibliografiaItem {
  id?: number;
  texto: string;
  categoria: BibliografiaCategoria;
}

export interface EvaluacionFila {
  unidad: string;
  criterio: string;
  producto: string;
  instrumento: string;
  nota_peso: number;
  nota_sum: number;
}

export interface ModalSeccion4Data {
  estrategia: string;
  recursos: string;
  bibliografia: BibliografiaItem[];
  matriz: EvaluacionFila[];
  notaFinalFormula: string;
}
