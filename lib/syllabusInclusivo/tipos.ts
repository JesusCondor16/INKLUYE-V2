// lib/syllabusInclusivo/tipos.ts
// Datos que necesita la version inclusiva del syllabus (WCAG 2.1 AAA).
// Los llena models/syllabusInclusivoModel.ts desde la base de datos.

export interface DatosSyllabusInclusivo {
  curso: {
    id: number;
    name: string;
    code: string;
    sumilla: string | null;
    credits: number | null;
    type: string | null;
    area: string | null;
    weeks: number | null;
    theoryHours: number | null;
    practiceHours: number | null;
    labHours: number | null;
    semester: string | null;
    cycle: string | null;
    modality: string | null;
  };
  coordinador: string | null;
  docentes: string[];
  prerequisitos: string[];
  competencias: { codigo: string; descripcion: string; tipo: string | null; nivel: string | null }[];
  logros: { codigo: string; descripcion: string }[];
  capacidades: { id: number; nombre: string; descripcion: string }[];
  programacion: {
    capacidadId: number;
    semana: string;
    logroUnidad: string | null;
    contenido: string | null;
    actividades: string | null;
    recursos: string | null;
    estrategias: string | null;
  }[];
  estrategia: string[];
  recursos: string[];
  matriz: { unidad: string; criterio: string; producto: string; instrumento: string; peso: number | null; nota: string }[];
  bibliografia: { texto: string; categoria: string }[];
  /** Fecha de generacion (ISO); se muestra al pie */
  generadoEn: string;
}
