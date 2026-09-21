// app/components/ModalsSyllabus/ModalSeccion1/ModalSeccion1.model.ts

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: string;
}

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

  sumilla?: string | null;

  prerequisites?: {
    prerequisite: {
      name: string;
    };
  }[];

  cursoDocentes?: {
    user: Usuario;
  }[];

  docentes?: Usuario[];

  coordinador?: {
    id: number;
    name: string;
    email: string;
    role?: string;
  } | null;
}