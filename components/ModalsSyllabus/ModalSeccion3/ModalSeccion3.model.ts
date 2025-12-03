// app/components/ModalsSyllabus/ModalSeccion3/ModalSeccion3.model.ts

export interface Fila {
  semana: string;
  contenido: string;
  actividades: string;
  recursos: string;
  estrategias: string;
  fixed?: boolean;
}

export interface Programacion {
  logroUnidad: string;
  filas: Fila[];
}

export interface Capacidad {
  id?: number;
  nombre: string;
  descripcion: string;
  logro?: string;
  filas?: Fila[];
}
