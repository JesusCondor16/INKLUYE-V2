// lib/glosario.ts
// Fuente unica de las definiciones que usa el sistema:
//  - la pagina /glosario (WCAG 2.1 - 3.1.3 Palabras inusuales y 3.1.4 Abreviaturas, AAA)
//  - las ayudas dentro de los modales del syllabus (WCAG 2.1 - 3.3.5 Ayuda, AAA)
// Redaccion en frases cortas y palabras comunes (WCAG 2.1 - 3.1.5 Nivel de lectura, AAA).

export interface EntradaGlosario {
  id: string;
  termino: string;
  definicion: string;
}

export const TERMINOS: EntradaGlosario[] = [
  {
    id: 'syllabus',
    termino: 'Syllabus (sílabo)',
    definicion:
      'Documento que explica un curso: de qué trata, qué aprenderán los estudiantes, cómo se enseñará y cómo se evaluará.',
  },
  {
    id: 'sumilla',
    termino: 'Sumilla',
    definicion: 'Resumen corto del curso. Dice de qué trata y cuáles son sus temas principales.',
  },
  {
    id: 'competencia',
    termino: 'Competencia',
    definicion:
      'Lo que el estudiante debe saber hacer al terminar la carrera. Cada curso ayuda a lograr algunas competencias.',
  },
  {
    id: 'logro',
    termino: 'Logro de aprendizaje',
    definicion: 'Lo que el estudiante será capaz de hacer al terminar este curso. Se puede observar y evaluar.',
  },
  {
    id: 'capacidad',
    termino: 'Capacidad',
    definicion: 'Una parte del logro del curso. Se trabaja en una unidad del curso.',
  },
  {
    id: 'programacion',
    termino: 'Programación de contenidos',
    definicion: 'Plan de cada semana: qué temas se verán, qué actividades se harán y qué recursos se usarán.',
  },
  {
    id: 'estrategia',
    termino: 'Estrategia didáctica',
    definicion: 'Forma en que el docente enseñará el curso. Por ejemplo: clases, talleres o trabajo en grupo.',
  },
  {
    id: 'recursos',
    termino: 'Recursos y materiales',
    definicion: 'Lo que se usará en clase. Por ejemplo: diapositivas, programas de computadora o lecturas.',
  },
  {
    id: 'evaluacion',
    termino: 'Matriz de evaluación',
    definicion: 'Tabla que muestra qué se evaluará en cada unidad, con qué instrumento y cuánto vale cada nota.',
  },
  {
    id: 'bibliografia',
    termino: 'Bibliografía',
    definicion: 'Lista de libros, revistas, tesis y páginas que se usarán en el curso.',
  },
  {
    id: 'borrador',
    termino: 'Borrador',
    definicion: 'El syllabus todavía se está preparando. Solo lo ven el coordinador del curso y el director.',
  },
  {
    id: 'revision',
    termino: 'En revisión',
    definicion: 'El coordinador envió el syllabus a los docentes del curso para que lo revisen.',
  },
  {
    id: 'publicado',
    termino: 'Publicado',
    definicion: 'Un docente aprobó el syllabus. Ahora todos los estudiantes pueden verlo.',
  },
];

export const SIGLAS: EntradaGlosario[] = [
  {
    id: 'wcag',
    termino: 'WCAG',
    definicion:
      'Pautas de Accesibilidad para el Contenido Web. Son reglas internacionales para que todas las personas puedan usar una página web.',
  },
  {
    id: 'aaa',
    termino: 'AAA',
    definicion: 'Nivel más alto de cumplimiento de las pautas WCAG. Los otros niveles son A y AA.',
  },
  {
    id: 'pdf',
    termino: 'PDF',
    definicion: 'Formato de documento portátil. Es un archivo que se ve igual en cualquier computadora o celular.',
  },
  { id: 'es', termino: 'ES', definicion: 'Español.' },
  { id: 'en', termino: 'EN', definicion: 'Inglés.' },
  { id: 'zh', termino: '中文', definicion: 'Chino (se lee «zhōngwén»).' },
];

/** Busca una entrada por id; lanza error si no existe para detectar erratas al programar */
export function definicion(id: string): EntradaGlosario {
  const e = [...TERMINOS, ...SIGLAS].find((x) => x.id === id);
  if (!e) throw new Error(`Término "${id}" no está en el glosario`);
  return e;
}
