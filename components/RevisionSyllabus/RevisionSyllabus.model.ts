// components/RevisionSyllabus/RevisionSyllabus.model.ts
import type { EnlaceIdioma } from '@/components/IdiomasSyllabus/IdiomasSyllabus';

export interface SyllabusPendiente {
  id: number;
  code: string;
  name: string;
  coordinador: string;
  pdfUrl: string | null;
  enviadoEn: string | null;
  idiomas: EnlaceIdioma[];
}

export const MAX_OBSERVACION = 2000;
