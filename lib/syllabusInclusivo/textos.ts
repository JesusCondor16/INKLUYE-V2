// lib/syllabusInclusivo/textos.ts
// Funciones puras que limpian y ordenan el texto del syllabus antes de armar el HTML.

/** Escapa texto para insertarlo en HTML (todo dato de la base pasa por aqui) */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Une espacios, tabulaciones y saltos de linea repetidos */
export function normalizarEspacios(texto: string | null | undefined): string {
  return (texto ?? '').replace(/\s+/g, ' ').trim();
}

export interface GrupoLista {
  titulo: string | null;
  items: string[];
}

/**
 * Convierte el texto libre de la programacion en grupos de items.
 * "Docente:\n - Expone\n Alumno:\n - Presenta" -> [{titulo:'Docente', items:['Expone']}, {titulo:'Alumno', items:['Presenta']}]
 * Las lineas que empiezan con "-" son items; una linea que termina en ":" abre un grupo.
 */
export function aGrupos(texto: string | null | undefined): GrupoLista[] {
  const grupos: GrupoLista[] = [];
  let actual: GrupoLista = { titulo: null, items: [] };

  for (const cruda of (texto ?? '').split(/\r?\n/)) {
    const linea = cruda.trim();
    if (!linea) continue;

    if (linea.endsWith(':') && !linea.startsWith('-')) {
      if (actual.titulo !== null || actual.items.length) grupos.push(actual);
      actual = { titulo: linea.slice(0, -1).trim(), items: [] };
      continue;
    }

    const item = linea.replace(/^[-•*]\s*/, '').replace(/[;,]$/, '').trim();
    if (item) actual.items.push(item);
  }
  if (actual.titulo !== null || actual.items.length) grupos.push(actual);
  return grupos;
}

/** Numero de semana a partir del texto ("1", " 10 ") para ordenar */
export function numeroSemana(semana: string): number {
  const n = parseInt(semana, 10);
  return Number.isNaN(n) ? Number.MAX_SAFE_INTEGER : n;
}

export interface FilaSemana {
  semana: string;
  logroUnidad: string | null;
  contenido: string | null;
  actividades: string | null;
  recursos: string | null;
  estrategias: string | null;
}

export interface BloqueSemanas<T extends FilaSemana> {
  desde: number;
  hasta: number;
  fila: T;
}

/**
 * Agrupa semanas consecutivas con exactamente el mismo plan (WCAG 2.1 - 3.1.5):
 * un lector de pantalla no repite seis veces el mismo contenido.
 */
export function agruparSemanas<T extends FilaSemana>(filas: T[]): BloqueSemanas<T>[] {
  const firma = (f: T) =>
    [f.logroUnidad, f.contenido, f.actividades, f.recursos, f.estrategias].map(normalizarEspacios).join('|');

  const ordenadas = [...filas].sort((a, b) => numeroSemana(a.semana) - numeroSemana(b.semana));
  const bloques: BloqueSemanas<T>[] = [];

  for (const fila of ordenadas) {
    const n = numeroSemana(fila.semana);
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.hasta + 1 === n && firma(ultimo.fila) === firma(fila)) {
      ultimo.hasta = n;
    } else {
      bloques.push({ desde: n, hasta: n, fila });
    }
  }
  return bloques;
}

/** "Semana 1", "Semanas 10 y 11", "Semanas 2 a 7" */
export function etiquetaSemanas(desde: number, hasta: number): string {
  if (desde === hasta) return `Semana ${desde}`;
  if (hasta === desde + 1) return `Semanas ${desde} y ${hasta}`;
  return `Semanas ${desde} a ${hasta}`;
}

/** Quita duplicados exactos (ignorando espacios y mayusculas) manteniendo el orden */
export function sinDuplicados<T>(lista: T[], clave: (x: T) => string): T[] {
  const vistos = new Set<string>();
  return lista.filter((x) => {
    const k = normalizarEspacios(clave(x)).toLowerCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}
