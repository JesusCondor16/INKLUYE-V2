// app/components/ModalsSyllabus/ModalSeccion1/ModalSeccion1.model.ts

export interface Curso {
  id: number;
  name: string;
  code: string;
  type?: string | null;
  area?: string | null;
  weeks?: number | null;
  theoryHours?: number | null;
  practiceHours?: number | null;
  labHours?: number | null;
  semester?: string | null;
  cycle?: string | null;
  credits?: number | null;
  modality?: string | null;
  prerequisites?: { prerequisite: { name: string } }[];
  
  // Docentes: vienen de tabla user
  cursoDocentes?: { user: { id: number; name: string; email: string } }[];
  docentes?: { id: number; name: string; email: string }[];

  // Coordinador: viene de tabla user
  coordinador?: { id: number; name: string; email: string } | null;

  sumilla?: string | null;
}
