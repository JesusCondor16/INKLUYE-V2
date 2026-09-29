// components/RevisionSyllabus/RevisionSyllabus.model.ts
export interface SyllabusPendiente {
  id: number;
  code: string;
  name: string;
  coordinador: string;
  pdfUrl: string | null;
  enviadoEn: string | null;
}

export const MAX_OBSERVACION = 2000;
