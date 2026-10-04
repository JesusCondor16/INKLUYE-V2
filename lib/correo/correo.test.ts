import { construirCorreoFlujo, type DatosCorreoFlujo } from './plantillas';

// nodemailer simulado: ningun correo sale de verdad durante las pruebas
const sendMail = jest.fn();
jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: jest.fn(() => ({ sendMail })) },
}));

const base: DatosCorreoFlujo = {
  accion: 'ENVIAR',
  destinatario: 'Luzmila Pro',
  actor: 'Jose Herrera',
  nombreCurso: '202W0901 - DESARROLLO DE TESIS I',
  enlace: 'http://localhost:3000/docente/syllabus',
};

describe('construirCorreoFlujo', () => {
  it('ENVIAR: asunto claro, saludo y enlace con texto que dice a dónde lleva (WCAG 2.4.4)', () => {
    const c = construirCorreoFlujo(base);
    expect(c.asunto).toBe('Syllabus por revisar: 202W0901 - DESARROLLO DE TESIS I');
    expect(c.texto).toContain('Hola, Luzmila Pro:');
    expect(c.texto).toContain('Revisar el syllabus en Inkluye: http://localhost:3000/docente/syllabus');
    expect(c.html).toContain('<html lang="es">');
    expect(c.html).toContain('>Revisar el syllabus en Inkluye</a>');
  });

  it('DEVOLVER: incluye las observaciones del docente', () => {
    const c = construirCorreoFlujo({ ...base, accion: 'DEVOLVER', observacion: 'Actualizar la bibliografía.' });
    expect(c.asunto).toContain('devuelto con observaciones');
    expect(c.texto).toContain('Observaciones:\nActualizar la bibliografía.');
    expect(c.html).toContain('<h2');
  });

  it('las observaciones solo se muestran al devolver', () => {
    const c = construirCorreoFlujo({ ...base, accion: 'PUBLICAR', observacion: 'no debería salir' });
    expect(c.texto).not.toContain('no debería salir');
  });

  it('escapa el texto: una observación con HTML no se interpreta', () => {
    const c = construirCorreoFlujo({ ...base, accion: 'DEVOLVER', observacion: '<img src=x onerror=alert(1)>' });
    expect(c.html).not.toContain('<img src=x');
    expect(c.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });

  it('siempre trae versión en texto plano para lectores de correo sin HTML', () => {
    for (const accion of ['ENVIAR', 'DEVOLVER', 'PUBLICAR'] as const) {
      const c = construirCorreoFlujo({ ...base, accion });
      expect(c.texto.length).toBeGreaterThan(50);
      expect(c.texto).not.toContain('<');
    }
  });
});

describe('enviarCorreos', () => {
  const ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    sendMail.mockReset();
    process.env = { ...ENV };
    // next/jest carga el .env del proyecto: se limpian estas variables para que
    // las pruebas den lo mismo en cualquier computadora (con o sin candado configurado)
    for (const k of ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'CORREO_REMITENTE', 'CORREO_PERMITIDOS']) {
      delete process.env[k];
    }
  });
  afterAll(() => {
    process.env = ENV;
  });

  const correo = construirCorreoFlujo(base);

  it('sin configuración SMTP no intenta enviar nada (el sistema sigue funcionando)', async () => {
    delete process.env.SMTP_HOST;
    const { enviarCorreos, correoConfigurado } = await import('./enviar');
    expect(correoConfigurado()).toBe(false);
    await expect(enviarCorreos([{ para: 'a@unmsm.edu.pe', correo }])).resolves.toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('con configuración envía texto y HTML a cada destinatario', async () => {
    Object.assign(process.env, { SMTP_HOST: 'smtp.test', SMTP_USER: 'inkluye@unmsm.edu.pe', SMTP_PASS: 'x' });
    sendMail.mockResolvedValue({});
    const { enviarCorreos } = await import('./enviar');
    await expect(enviarCorreos([{ para: 'l.pro@unmsm.edu.pe', correo }])).resolves.toBe(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'l.pro@unmsm.edu.pe', subject: correo.asunto, text: correo.texto, html: correo.html }),
    );
  });

  it('con CORREO_PERMITIDOS solo envía a esas direcciones (candado de pruebas)', async () => {
    Object.assign(process.env, {
      SMTP_HOST: 'smtp.test',
      SMTP_USER: 'inkluye@unmsm.edu.pe',
      SMTP_PASS: 'x',
      CORREO_PERMITIDOS: ' Jesus.Condor3@unmsm.edu.pe , jesuscondor837@gmail.com',
    });
    sendMail.mockResolvedValue({});
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const { enviarCorreos } = await import('./enviar');
    await expect(
      enviarCorreos([
        { para: 'jesus.condor3@unmsm.edu.pe', correo },
        { para: 'profesora.real@unmsm.edu.pe', correo },
      ]),
    ).resolves.toBe(1);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'jesus.condor3@unmsm.edu.pe' }));
  });

  it('con CORREO_PERMITIDOS y ningún destinatario permitido, no envía nada', async () => {
    Object.assign(process.env, {
      SMTP_HOST: 'smtp.test',
      SMTP_USER: 'inkluye@unmsm.edu.pe',
      SMTP_PASS: 'x',
      CORREO_PERMITIDOS: 'jesuscondor837@gmail.com',
    });
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const { enviarCorreos } = await import('./enviar');
    await expect(enviarCorreos([{ para: 'otra.persona@unmsm.edu.pe', correo }])).resolves.toBe(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('si un correo falla, los demás se envían igual y no lanza error', async () => {
    Object.assign(process.env, { SMTP_HOST: 'smtp.test', SMTP_USER: 'inkluye@unmsm.edu.pe', SMTP_PASS: 'x' });
    sendMail.mockRejectedValueOnce(new Error('buzón lleno')).mockResolvedValueOnce({});
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const { enviarCorreos } = await import('./enviar');
    await expect(
      enviarCorreos([
        { para: 'uno@unmsm.edu.pe', correo },
        { para: 'dos@unmsm.edu.pe', correo },
      ]),
    ).resolves.toBe(1);
    // El log no guarda el correo completo de la persona
    expect(String(error.mock.calls[0][0])).toContain('*@unmsm.edu.pe');
    expect(String(error.mock.calls[0][0])).not.toContain('uno@');
    error.mockRestore();
  });
});
