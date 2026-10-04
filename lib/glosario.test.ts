import { TERMINOS, SIGLAS, definicion } from './glosario';

describe('glosario (WCAG 2.1 - 3.1.3, 3.1.4, 3.3.5)', () => {
  it('no repite ids', () => {
    const ids = [...TERMINOS, ...SIGLAS].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('toda entrada tiene término y definición', () => {
    for (const e of [...TERMINOS, ...SIGLAS]) {
      expect(e.termino.trim()).not.toBe('');
      expect(e.definicion.trim()).not.toBe('');
    }
  });

  it('incluye los términos que usan los modales del syllabus', () => {
    for (const id of ['sumilla', 'competencia', 'logro', 'capacidad', 'programacion', 'estrategia', 'recursos', 'evaluacion', 'bibliografia']) {
      expect(definicion(id).id).toBe(id);
    }
  });

  it('incluye las siglas que aparecen en las páginas', () => {
    for (const id of ['wcag', 'aaa', 'pdf', 'es', 'en', 'zh']) {
      expect(definicion(id).id).toBe(id);
    }
  });

  it('frases cortas: ninguna oración de las definiciones pasa de 25 palabras (3.1.5)', () => {
    for (const e of [...TERMINOS, ...SIGLAS]) {
      for (const oracion of e.definicion.split(/[.:]/)) {
        expect(oracion.trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(25);
      }
    }
  });

  it('un id inexistente lanza error (evita erratas al programar)', () => {
    expect(() => definicion('no-existe')).toThrow();
  });
});
