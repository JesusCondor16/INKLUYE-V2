// components/EstadoSyllabus/EstadoSyllabus.model.ts
import type { EnlaceIdioma, EnlaceInclusivo } from '@/components/IdiomasSyllabus/IdiomasSyllabus';

export type EstadoSyllabus = 'BORRADOR' | 'ENVIADO_DOCENTE' | 'PUBLICADO';
export type AccionSyllabus = 'GENERADO' | 'ENVIADO' | 'DEVUELTO' | 'PUBLICADO';

export interface HistorialSyllabusItem {
  id: number;
  accion: AccionSyllabus;
  observacion: string | null;
  fecha: string;
  usuario: { name: string; role: string };
}

export interface EstadoSyllabusResponse {
  estado: EstadoSyllabus | null;
  historial: HistorialSyllabusItem[];
  idiomas: EnlaceIdioma[];
  inclusivo: EnlaceInclusivo[];
}

export const ETIQUETA_ESTADO: Record<EstadoSyllabus, string> = {
  BORRADOR: 'Borrador',
  ENVIADO_DOCENTE: 'En revisión por docentes',
  PUBLICADO: 'Publicado para estudiantes',
};

export const DESCRIPCION_ESTADO: Record<EstadoSyllabus, string> = {
  BORRADOR: 'Solo tú puedes verlo. Cuando esté listo, envíalo a los docentes del curso.',
  ENVIADO_DOCENTE: 'Los docentes del curso lo están revisando. Pueden publicarlo o devolverlo con observaciones.',
  PUBLICADO: 'Los estudiantes ya pueden verlo. Si vuelves a generar el PDF, regresará a borrador.',
};

export const ETIQUETA_ACCION: Record<AccionSyllabus, string> = {
  GENERADO: 'PDF generado',
  ENVIADO: 'Enviado a docentes',
  DEVUELTO: 'Devuelto con observaciones',
  PUBLICADO: 'Publicado',
};
