import fs from 'fs';
import path from 'path';
import {
  CARPETA_SYLLABUS,
  esIdiomaSyllabus,
  idiomaDesdeNombreArchivo,
  idiomasDisponibles,
  rutaArchivoSyllabus,
  urlSyllabus,
} from './syllabusArchivos';

describe('esIdiomaSyllabus', () => {
  it.each(['es', 'en', 'zh'])('acepta "%s"', (lang) => {
    expect(esIdiomaSyllabus(lang)).toBe(true);
  });

  it.each(['fr', 'ES', '', 'español'])('rechaza "%s"', (lang) => {
    expect(esIdiomaSyllabus(lang)).toBe(false);
  });
});

describe('idiomaDesdeNombreArchivo (validacion del nombre del PDF subido)', () => {
  it.each([
    ['1-es.pdf', 'es'],
    ['1-en.pdf', 'en'],
    ['1-zh.pdf', 'zh'],
  ])('acepta "%s" para el curso 1 -> %s', (nombre, lang) => {
    expect(idiomaDesdeNombreArchivo(1, nombre)).toBe(lang);
  });

  it.each([
    ['PDF de otro curso', '2-es.pdf'],
    ['intento de path traversal', '../1-es.pdf'],
    ['ruta con carpeta', 'x/1-es.pdf'],
    ['idioma no soportado', '1-fr.pdf'],
    ['idioma en mayusculas', '1-ES.pdf'],
    ['sin extension .pdf', '1-es'],
    ['extension distinta', '1-es.exe'],
    ['id que solo empieza igual', '11-es.pdf'],
  ])('rechaza %s ("%s")', (_caso, nombre) => {
    expect(idiomaDesdeNombreArchivo(1, nombre)).toBeNull();
  });
});

describe('rutas y URLs', () => {
  it('guarda los PDF en storage/syllabus, fuera de public/ (no accesibles sin permiso)', () => {
    const ruta = rutaArchivoSyllabus(5, 'es');
    expect(ruta).toBe(path.join(CARPETA_SYLLABUS, '5-es.pdf'));
    expect(ruta.split(path.sep)).toContain('storage');
    expect(ruta.split(path.sep)).not.toContain('public');
  });

  it('la URL publica pasa siempre por la ruta que valida permisos', () => {
    expect(urlSyllabus(5, 'zh')).toBe('/api/cursos/5/syllabus-pdf?lang=zh');
  });
});

describe('idiomasDisponibles', () => {
  afterEach(() => jest.restoreAllMocks());

  it('devuelve solo los idiomas cuyo PDF existe, con su fecha de generacion', () => {
    const fecha = new Date('2026-09-28T20:00:00.000Z');
    // Simula el disco: existen ES y ZH, falta EN
    jest.spyOn(fs, 'statSync').mockImplementation(((ruta: fs.PathLike) => {
      if (String(ruta).endsWith('1-en.pdf')) throw new Error('ENOENT');
      return { mtime: fecha } as fs.Stats;
    }) as typeof fs.statSync);

    expect(idiomasDisponibles(1)).toEqual([
      { lang: 'es', url: '/api/cursos/1/syllabus-pdf?lang=es', generadoEn: fecha.toISOString() },
      { lang: 'zh', url: '/api/cursos/1/syllabus-pdf?lang=zh', generadoEn: fecha.toISOString() },
    ]);
  });

  it('devuelve una lista vacia si no existe ningun PDF', () => {
    jest.spyOn(fs, 'statSync').mockImplementation(() => {
      throw new Error('ENOENT');
    });
    expect(idiomasDisponibles(1)).toEqual([]);
  });
});
