import { evaluarTransicion, esAccionFlujo, MAX_OBSERVACION, type ContextoTransicion } from './syllabusFlujo';

// Contexto base: coordinador duenio del curso con el syllabus en borrador
const ctx = (cambios: Partial<ContextoTransicion> = {}): ContextoTransicion => ({
  accion: 'ENVIAR',
  estadoActual: 'BORRADOR',
  rol: 'coordinador',
  esCoordinadorDelCurso: true,
  esDocenteDelCurso: false,
  ...cambios,
});

// Docente asignado al curso, con el syllabus enviado a revision
const docenteAsignado = (cambios: Partial<ContextoTransicion> = {}) =>
  ctx({ rol: 'docente', esCoordinadorDelCurso: false, esDocenteDelCurso: true, estadoActual: 'ENVIADO_DOCENTE', ...cambios });

describe('esAccionFlujo', () => {
  it('acepta las tres acciones del flujo', () => {
    expect(esAccionFlujo('ENVIAR')).toBe(true);
    expect(esAccionFlujo('DEVOLVER')).toBe(true);
    expect(esAccionFlujo('PUBLICAR')).toBe(true);
  });

  it('rechaza valores que no son acciones del flujo', () => {
    expect(esAccionFlujo('BORRAR')).toBe(false);
    expect(esAccionFlujo('enviar')).toBe(false);
    expect(esAccionFlujo(undefined)).toBe(false);
    expect(esAccionFlujo(42)).toBe(false);
  });
});

describe('ENVIAR (coordinador -> docentes)', () => {
  it('el coordinador duenio envia un borrador y pasa a ENVIADO_DOCENTE', () => {
    expect(evaluarTransicion(ctx())).toEqual({
      ok: true,
      nuevoEstado: 'ENVIADO_DOCENTE',
      accionHistorial: 'ENVIADO',
      observacion: null,
    });
  });

  it('un coordinador que no es duenio del curso no puede enviar (403)', () => {
    expect(evaluarTransicion(ctx({ esCoordinadorDelCurso: false }))).toMatchObject({ ok: false, status: 403 });
  });

  it('un docente no puede enviar aunque este asignado al curso (403)', () => {
    expect(evaluarTransicion(docenteAsignado({ accion: 'ENVIAR', estadoActual: 'BORRADOR' }))).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it('el director no participa del flujo de envio (403)', () => {
    expect(evaluarTransicion(ctx({ rol: 'director', esCoordinadorDelCurso: false }))).toMatchObject({
      ok: false,
      status: 403,
    });
  });

  it.each(['ENVIADO_DOCENTE', 'PUBLICADO'] as const)('no se puede enviar un syllabus en estado %s (409)', (estado) => {
    expect(evaluarTransicion(ctx({ estadoActual: estado }))).toMatchObject({ ok: false, status: 409 });
  });
});

describe('DEVOLVER (docente -> coordinador, con observaciones)', () => {
  it('un docente asignado devuelve con observacion y vuelve a BORRADOR', () => {
    expect(evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', observacion: 'Actualizar bibliografia' }))).toEqual({
      ok: true,
      nuevoEstado: 'BORRADOR',
      accionHistorial: 'DEVUELTO',
      observacion: 'Actualizar bibliografia',
    });
  });

  it('recorta los espacios al inicio y al final de la observacion', () => {
    const r = evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', observacion: '   Falta la unidad 3   ' }));
    expect(r).toMatchObject({ ok: true, observacion: 'Falta la unidad 3' });
  });

  it.each([
    ['sin observacion', undefined],
    ['observacion vacia', ''],
    ['observacion solo con espacios', '    '],
  ])('rechaza devolver %s (400)', (_caso, observacion) => {
    expect(evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', observacion }))).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it(`acepta exactamente ${MAX_OBSERVACION} caracteres y rechaza uno mas (400)`, () => {
    const justo = 'x'.repeat(MAX_OBSERVACION);
    expect(evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', observacion: justo }))).toMatchObject({ ok: true });
    expect(evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', observacion: justo + 'x' }))).toMatchObject({
      ok: false,
      status: 400,
    });
  });

  it('un docente que no esta asignado al curso no puede devolver (403)', () => {
    expect(
      evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', esDocenteDelCurso: false, observacion: 'x' })),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it.each(['BORRADOR', 'PUBLICADO'] as const)('no se puede devolver un syllabus en estado %s (409)', (estado) => {
    expect(
      evaluarTransicion(docenteAsignado({ accion: 'DEVOLVER', estadoActual: estado, observacion: 'x' })),
    ).toMatchObject({ ok: false, status: 409 });
  });
});

describe('PUBLICAR (docente -> estudiantes)', () => {
  it('un docente asignado publica un syllabus enviado a revision', () => {
    expect(evaluarTransicion(docenteAsignado({ accion: 'PUBLICAR' }))).toEqual({
      ok: true,
      nuevoEstado: 'PUBLICADO',
      accionHistorial: 'PUBLICADO',
      observacion: null,
    });
  });

  it('un coordinador que dicta el curso (asignado en cursodocente) tambien puede publicar', () => {
    const r = evaluarTransicion(
      ctx({ accion: 'PUBLICAR', estadoActual: 'ENVIADO_DOCENTE', esCoordinadorDelCurso: false, esDocenteDelCurso: true }),
    );
    expect(r).toMatchObject({ ok: true, nuevoEstado: 'PUBLICADO' });
  });

  it('el coordinador duenio puede autoaprobarse si tambien esta asignado como docente (decision de diseno)', () => {
    const r = evaluarTransicion(
      ctx({ accion: 'PUBLICAR', estadoActual: 'ENVIADO_DOCENTE', esCoordinadorDelCurso: true, esDocenteDelCurso: true }),
    );
    expect(r).toMatchObject({ ok: true, nuevoEstado: 'PUBLICADO' });
  });

  it('el coordinador duenio NO puede publicar si no esta asignado como docente (403)', () => {
    const r = evaluarTransicion(ctx({ accion: 'PUBLICAR', estadoActual: 'ENVIADO_DOCENTE' }));
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it('un estudiante no puede publicar (403)', () => {
    const r = evaluarTransicion(
      ctx({ accion: 'PUBLICAR', rol: 'estudiante', estadoActual: 'ENVIADO_DOCENTE', esCoordinadorDelCurso: false }),
    );
    expect(r).toMatchObject({ ok: false, status: 403 });
  });

  it.each(['BORRADOR', 'PUBLICADO'] as const)('no se puede publicar un syllabus en estado %s (409)', (estado) => {
    expect(evaluarTransicion(docenteAsignado({ accion: 'PUBLICAR', estadoActual: estado }))).toMatchObject({
      ok: false,
      status: 409,
    });
  });
});

describe('orden de validacion', () => {
  it('sin permiso se responde 403 antes de revisar el estado (no revela el estado a quien no tiene acceso)', () => {
    const r = evaluarTransicion(ctx({ accion: 'PUBLICAR', rol: 'estudiante', estadoActual: 'BORRADOR' }));
    expect(r).toMatchObject({ ok: false, status: 403 });
  });
});

describe('flujo completo', () => {
  it('borrador -> enviar -> devolver -> enviar -> publicar', () => {
    const pasos: Array<[ContextoTransicion['accion'], Partial<ContextoTransicion>, string]> = [
      ['ENVIAR', { rol: 'coordinador', esCoordinadorDelCurso: true, esDocenteDelCurso: false }, 'ENVIADO_DOCENTE'],
      ['DEVOLVER', { rol: 'docente', esCoordinadorDelCurso: false, esDocenteDelCurso: true, observacion: 'Corregir' }, 'BORRADOR'],
      ['ENVIAR', { rol: 'coordinador', esCoordinadorDelCurso: true, esDocenteDelCurso: false }, 'ENVIADO_DOCENTE'],
      ['PUBLICAR', { rol: 'docente', esCoordinadorDelCurso: false, esDocenteDelCurso: true }, 'PUBLICADO'],
    ];

    let estado: ContextoTransicion['estadoActual'] = 'BORRADOR';
    for (const [accion, actor, esperado] of pasos) {
      const r = evaluarTransicion(ctx({ ...actor, accion, estadoActual: estado }));
      expect(r.ok).toBe(true);
      if (r.ok) estado = r.nuevoEstado;
      expect(estado).toBe(esperado);
    }
  });
});
