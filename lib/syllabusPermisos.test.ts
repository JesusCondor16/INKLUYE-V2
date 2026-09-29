import { puedeVerSyllabus, type ContextoAccesoSyllabus } from './syllabusPermisos';

type Estado = ContextoAccesoSyllabus['estado'];
const ESTADOS: Estado[] = ['BORRADOR', 'ENVIADO_DOCENTE', 'PUBLICADO'];

// Cada perfil de usuario y los estados en los que DEBE poder ver el PDF
const MATRIZ: Array<{ perfil: string; ctx: Omit<ContextoAccesoSyllabus, 'estado'>; puedeVer: Estado[] }> = [
  {
    perfil: 'director',
    ctx: { rol: 'director', esCoordinadorDelCurso: false, esDocenteDelCurso: false },
    puedeVer: ['BORRADOR', 'ENVIADO_DOCENTE', 'PUBLICADO'],
  },
  {
    perfil: 'coordinador duenio del curso',
    ctx: { rol: 'coordinador', esCoordinadorDelCurso: true, esDocenteDelCurso: false },
    puedeVer: ['BORRADOR', 'ENVIADO_DOCENTE', 'PUBLICADO'],
  },
  {
    perfil: 'coordinador de otro curso',
    ctx: { rol: 'coordinador', esCoordinadorDelCurso: false, esDocenteDelCurso: false },
    puedeVer: ['PUBLICADO'],
  },
  {
    perfil: 'coordinador que dicta el curso (asignado como docente)',
    ctx: { rol: 'coordinador', esCoordinadorDelCurso: false, esDocenteDelCurso: true },
    puedeVer: ['ENVIADO_DOCENTE', 'PUBLICADO'],
  },
  {
    perfil: 'docente asignado al curso',
    ctx: { rol: 'docente', esCoordinadorDelCurso: false, esDocenteDelCurso: true },
    puedeVer: ['ENVIADO_DOCENTE', 'PUBLICADO'],
  },
  {
    perfil: 'docente no asignado',
    ctx: { rol: 'docente', esCoordinadorDelCurso: false, esDocenteDelCurso: false },
    puedeVer: ['PUBLICADO'],
  },
  {
    perfil: 'estudiante',
    ctx: { rol: 'estudiante', esCoordinadorDelCurso: false, esDocenteDelCurso: false },
    puedeVer: ['PUBLICADO'],
  },
];

describe('puedeVerSyllabus: matriz rol x estado', () => {
  for (const { perfil, ctx, puedeVer } of MATRIZ) {
    for (const estado of ESTADOS) {
      const esperado = puedeVer.includes(estado);
      it(`${perfil} ${esperado ? 'PUEDE' : 'NO puede'} ver un syllabus en ${estado}`, () => {
        expect(puedeVerSyllabus({ ...ctx, estado })).toBe(esperado);
      });
    }
  }
});

describe('puedeVerSyllabus: casos limite', () => {
  it('ser "duenio" no da acceso a un borrador si el rol no es coordinador', () => {
    expect(
      puedeVerSyllabus({ rol: 'docente', estado: 'BORRADOR', esCoordinadorDelCurso: true, esDocenteDelCurso: false }),
    ).toBe(false);
  });

  it('un usuario sin rol solo ve lo publicado', () => {
    expect(
      puedeVerSyllabus({ rol: undefined, estado: 'PUBLICADO', esCoordinadorDelCurso: false, esDocenteDelCurso: false }),
    ).toBe(true);
    expect(
      puedeVerSyllabus({ rol: undefined, estado: 'BORRADOR', esCoordinadorDelCurso: false, esDocenteDelCurso: false }),
    ).toBe(false);
  });
});
