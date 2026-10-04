import { aGrupos, agruparSemanas, escaparHtml, etiquetaSemanas, sinDuplicados } from './textos';

const fila = (semana: string, contenido: string) => ({
  semana,
  logroUnidad: 'Logro',
  contenido,
  actividades: 'Docente:\n - Expone',
  recursos: '- Videos',
  estrategias: '- Debate',
});

describe('escaparHtml', () => {
  it('neutraliza etiquetas y comillas (evita inyectar código en el sílabo)', () => {
    expect(escaparHtml('<script>alert("x")</script> & \'y\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;',
    );
  });
});

describe('aGrupos', () => {
  it('separa los grupos "Docente:" y "Alumno:" con sus items', () => {
    const texto = 'Docente:\n\t- Presentación del Sílabo\n\t- Exposición\n    \n Alumno:\n\t- Presenta su avance.\n ';
    expect(aGrupos(texto)).toEqual([
      { titulo: 'Docente', items: ['Presentación del Sílabo', 'Exposición'] },
      { titulo: 'Alumno', items: ['Presenta su avance.'] },
    ]);
  });

  it('una lista simple queda en un solo grupo sin título', () => {
    expect(aGrupos('- Videos\n - Tutoriales\n')).toEqual([{ titulo: null, items: ['Videos', 'Tutoriales'] }]);
  });

  it('texto vacío o nulo no produce grupos', () => {
    expect(aGrupos('')).toEqual([]);
    expect(aGrupos(null)).toEqual([]);
  });
});

describe('agruparSemanas', () => {
  it('junta semanas seguidas con el mismo plan, aunque cambien los espacios', () => {
    const filas = [fila('1', 'A'), fila('2', 'B'), fila('3', 'B '), fila('4', ' B'), fila('5', 'C')];
    expect(agruparSemanas(filas).map((b) => [b.desde, b.hasta])).toEqual([[1, 1], [2, 4], [5, 5]]);
  });

  it('no junta semanas iguales que no son seguidas', () => {
    const filas = [fila('1', 'A'), fila('2', 'B'), fila('3', 'A')];
    expect(agruparSemanas(filas)).toHaveLength(3);
  });

  it('ordena por número de semana aunque lleguen desordenadas ("10" va después de "9")', () => {
    const filas = [fila('10', 'X'), fila('9', 'Y'), fila('11', 'X')];
    expect(agruparSemanas(filas).map((b) => [b.desde, b.hasta])).toEqual([[9, 9], [10, 11]]);
  });
});

describe('etiquetaSemanas', () => {
  it('usa singular, "y" para dos semanas y "a" para un rango', () => {
    expect(etiquetaSemanas(1, 1)).toBe('Semana 1');
    expect(etiquetaSemanas(10, 11)).toBe('Semanas 10 y 11');
    expect(etiquetaSemanas(2, 7)).toBe('Semanas 2 a 7');
  });
});

describe('sinDuplicados', () => {
  it('quita repetidos exactos ignorando espacios y mayúsculas', () => {
    const r = sinDuplicados(['Levine, J. 2011', 'levine,  j. 2011', 'Otro'], (x) => x);
    expect(r).toEqual(['Levine, J. 2011', 'Otro']);
  });
});
