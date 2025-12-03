// app/components/ModalsSyllabus/ModalSeccion2/ModalSeccion2.model.ts

export interface Competencia {
  id?: number;
  codigo: string;
  descripcion: string;
  tipo: string;
  nivel: string;
  cursoId?: number;
}

export interface Logro {
  id?: number;
  codigo: string;
  descripcion: string;
  cursoId?: number;
}
