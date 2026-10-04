import { decidirAcceso, INICIO_POR_ROL } from './accesoPaginas';

const permitir = { tipo: 'permitir' };
const aInicio = (rol: keyof typeof INICIO_POR_ROL) => ({ tipo: 'redirigir', destino: INICIO_POR_ROL[rol] });

describe('decidirAcceso — páginas públicas', () => {
  it('la portada y el login se ven sin sesión', () => {
    expect(decidirAcceso('/', null, false)).toEqual(permitir);
    expect(decidirAcceso('/login', null, false)).toEqual(permitir);
  });

  it('con sesión iniciada, /login lleva a la página de inicio del rol', () => {
    expect(decidirAcceso('/login', 'coordinador', true)).toEqual(aInicio('coordinador'));
    expect(decidirAcceso('/login', 'estudiante', true)).toEqual(aInicio('estudiante'));
  });
});

describe('decidirAcceso — sin sesión válida', () => {
  it('sin cookie, manda al login sin aviso de expiración', () => {
    expect(decidirAcceso('/director', null, false)).toEqual({ tipo: 'login', sesionExpirada: false });
  });

  it('con cookie inválida o vencida, manda al login avisando que expiró', () => {
    expect(decidirAcceso('/buscar', null, true)).toEqual({ tipo: 'login', sesionExpirada: true });
  });

  it('un rol desconocido se trata como sin sesión', () => {
    expect(decidirAcceso('/perfil', 'administrador', true)).toEqual({ tipo: 'login', sesionExpirada: true });
    expect(decidirAcceso('/perfil', 'toString', true)).toEqual({ tipo: 'login', sesionExpirada: true });
  });
});

describe('decidirAcceso — por rol', () => {
  // [ruta, roles permitidos]
  const matriz: [string, string[]][] = [
    ['/director', ['director']],
    ['/director/cursos', ['director']],
    ['/director/docentes', ['director']],
    ['/coordinador', ['coordinador']],
    ['/coordinador/cursos', ['coordinador']],
    ['/coordinador/1/syllabus', ['coordinador']],
    ['/docente', ['docente']],
    ['/docente/syllabus', ['docente', 'coordinador']],
    ['/alumno', ['estudiante']],
    ['/buscar', ['director', 'coordinador', 'docente', 'estudiante']],
    ['/perfil', ['director', 'coordinador', 'docente', 'estudiante']],
    ['/informacion', ['director', 'coordinador', 'docente', 'estudiante']],
  ];
  const roles = ['director', 'coordinador', 'docente', 'estudiante'] as const;

  for (const [ruta, permitidos] of matriz) {
    for (const rol of roles) {
      const esperado = permitidos.includes(rol) ? permitir : aInicio(rol);
      it(`${rol} en ${ruta} → ${permitidos.includes(rol) ? 'permitido' : 'a su inicio'}`, () => {
        expect(decidirAcceso(ruta, rol, true)).toEqual(esperado);
      });
    }
  }

  it('un prefijo parecido no da acceso: /directorio no es /director', () => {
    expect(decidirAcceso('/directorio', 'estudiante', true)).toEqual(permitir); // ruta desconocida → 404 de Next
    expect(decidirAcceso('/docentes', 'estudiante', true)).toEqual(permitir);
  });
});
