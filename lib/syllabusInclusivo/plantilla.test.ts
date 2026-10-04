import { construirHtmlSyllabusInclusivo, resumenSencillo } from './plantilla';
import type { DatosSyllabusInclusivo } from './tipos';

// Datos con la forma real del curso 1 (Desarrollo de Tesis I), recortados
function datos(cambios: Partial<DatosSyllabusInclusivo> = {}): DatosSyllabusInclusivo {
  const semana = (n: string, contenido: string, capacidadId = 1) => ({
    capacidadId,
    semana: n,
    logroUnidad: 'Propone y desarrolla el aporte',
    contenido,
    actividades: 'Docente:\n\t- Retroalimentación\n Alumno:\n\t- Presenta su avance.',
    recursos: '- Material del docente\n - Recursos electrónicos de la Biblioteca Central UNMSM',
    estrategias: '- Expositiva participativa',
  });
  return {
    curso: {
      id: 1, name: 'DESARROLLO DE TESIS I', code: '202W0901',
      sumilla: 'Esta asignatura es de naturaleza teórica.', credits: 2, type: 'Obligatorio', area: 'Especialidad',
      weeks: 16, theoryHours: 3, practiceHours: 0, labHours: 0, semester: '2025-II', cycle: '9', modality: 'Presencial',
    },
    coordinador: 'Jose Herrera',
    docentes: ['Luzmila Pro'],
    prerequisitos: [],
    competencias: [{ codigo: 'CG1.3', descripcion: 'Actúa con valores.', tipo: 'General', nivel: 'Avanzado' }],
    logros: [],
    capacidades: [
      { id: 1, nombre: ' Unidad I', descripcion: 'Propone y desarrolla el aporte (RA1, RA2).' },
      { id: 2, nombre: 'Unidad II ', descripcion: 'Redacta un artículo científico (RA4).' },
    ],
    programacion: [
      semana('1', '- ¿Qué es el aporte?'),
      ...['2', '3', '4', '5', '6', '7'].map((n) => semana(n, ' - Bosquejo del aporte\n')),
      semana('8', 'Examen Parcial'),
      semana('9', '- Artículo científico', 2),
    ],
    estrategia: ['\n\nEl curso es un curso-taller.\nEl alumno participa.'],
    recursos: ['Aula virtual.'],
    matriz: [
      { unidad: '1', criterio: '- Desarrolla un software.', producto: 'Software', instrumento: 'Rúbrica', peso: 30, nota: 'N1' },
      { unidad: '2', criterio: '- Redacta un artículo.', producto: 'Artículo', instrumento: 'Rúbrica', peso: 70, nota: 'N2' },
    ],
    bibliografia: [
      { texto: 'Levine, J. (2011). Cómo escribir su tesis.', categoria: 'SOBRE_LA_TESIS' },
      { texto: 'Levine, J. (2011). Cómo escribir su tesis.', categoria: 'SOBRE_LA_TESIS' },
    ],
    generadoEn: '2026-10-04T15:00:00.000Z',
    ...cambios,
  };
}

const html = (d = datos()) => construirHtmlSyllabusInclusivo(d);

describe('construirHtmlSyllabusInclusivo — estructura (WCAG 2.1 1.3.1, 2.4.2, 3.1.1)', () => {
  it('declara el idioma español y un título propio', () => {
    expect(html()).toContain('<html lang="es">');
    expect(html()).toContain('<title>Sílabo de DESARROLLO DE TESIS I · Inkluye</title>');
  });

  it('tiene un solo h1, un main y un enlace para saltar al contenido', () => {
    const h = html();
    expect(h.match(/<h1/g)).toHaveLength(1);
    expect(h.match(/<main/g)).toHaveLength(1);
    expect(h).toContain('href="#contenido"');
  });

  it('el índice enlaza a cada sección que existe', () => {
    const h = html();
    for (const id of ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 'glosario']) {
      expect(h).toContain(`href="#${id}"`);
      expect(h).toContain(`<section id="${id}"`);
    }
  });

  it('la tabla de evaluación tiene título y encabezados de columna y fila', () => {
    const h = html();
    expect(h).toContain('<caption id="cap-eval">');
    expect(h.match(/<th scope="col">/g)!.length).toBeGreaterThanOrEqual(5);
    expect(h).toContain('<th scope="row">1 (N1)</th>');
  });
});

describe('construirHtmlSyllabusInclusivo — contenido', () => {
  it('agrupa las semanas 2 a 7 que tienen el mismo plan (3.1.5)', () => {
    const h = html();
    expect(h).toContain('Semanas 2 a 7');
    expect(h).not.toContain('Semana 3<');
  });

  it('marca las semanas de examen', () => {
    expect(html()).toContain('<li class="semana examen"><h4><span class="sem">Semana 8</span>Examen Parcial</h4></li>');
  });

  it('separa las actividades del docente y del alumno', () => {
    // Sin punto doble: "avance." ya termina en punto
    expect(html()).toContain('<li>Docente: Retroalimentación.</li><li>Alumno: Presenta su avance.</li>');
  });

  it('explica la fórmula de la nota también en palabras', () => {
    const h = html();
    expect(h).toContain('Nota final = 0,30 × N1 + 0,70 × N2');
    expect(h).toContain('La nota final suma el 30 % de la nota N1 (software), y el 70 % de la nota N2 (artículo).');
  });

  it('muestra un aviso cuando faltan los logros, en vez de una sección vacía', () => {
    expect(html()).toContain('El coordinador todavía no registró los logros de este curso.');
  });

  it('no repite la bibliografía duplicada', () => {
    expect(html().match(/Cómo escribir su tesis/g)).toHaveLength(1);
  });

  it('marca las siglas con su significado y las lista en el glosario (3.1.4)', () => {
    const h = html();
    expect(h).toContain('<abbr title="Resultado de aprendizaje">RA</abbr>1');
    expect(h).toContain('<abbr title="Universidad Nacional Mayor de San Marcos">UNMSM</abbr>');
    expect(h).toContain('<dt><abbr>RA</abbr></dt>');
    expect(h).not.toContain('<dt><abbr>APA</abbr></dt>'); // no aparece en estos datos
  });

  it('nunca muestra "undefined" ni "null"', () => {
    const h = html(datos({ coordinador: null, docentes: [], matriz: [], bibliografia: [] }));
    expect(h).not.toMatch(/undefined|>null</);
  });
});

describe('construirHtmlSyllabusInclusivo — seguridad', () => {
  it('escapa el texto de la base: un <script> en la sumilla no se ejecuta', () => {
    const d = datos();
    d.curso.sumilla = '<script>alert(1)</script>';
    const h = html(d);
    expect(h).not.toContain('<script>alert(1)</script>');
    expect(h).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('resumenSencillo (3.1.5)', () => {
  it('resume duración, créditos, unidades y de dónde sale la nota', () => {
    expect(resumenSencillo(datos())).toEqual([
      'Dura 16 semanas, con 3 horas de clase por semana.',
      'Vale 2 créditos.',
      'Tiene 2 unidades.',
      'Tu nota sale de: software (30 %) y artículo (70 %).',
    ]);
  });
});
