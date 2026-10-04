// lib/correo/plantillas.ts
// Textos de los correos del flujo del syllabus. Funcion pura: se prueba con Jest.
// Cada correo va en texto plano Y en HTML simple y accesible:
//  - lang="es", un solo titulo, parrafos cortos, enlace con texto que dice a donde lleva (WCAG 2.4.4),
//  - colores con contraste 7:1 y sin informacion solo en el color,
//  - la version en texto plano sirve a lectores de correo que no muestran HTML.
import { escaparHtml } from '@/lib/syllabusInclusivo/textos';

export type AccionCorreo = 'ENVIAR' | 'DEVOLVER' | 'PUBLICAR';

export interface DatosCorreoFlujo {
  accion: AccionCorreo;
  destinatario: string; // nombre de quien recibe
  actor: string; // nombre de quien hizo la accion
  nombreCurso: string; // "202W0901 - DESARROLLO DE TESIS I"
  enlace: string; // URL absoluta a la pagina de Inkluye
  observacion?: string | null; // solo DEVOLVER
}

export interface Correo {
  asunto: string;
  texto: string;
  html: string;
}

const CONTENIDO: Record<AccionCorreo, (d: DatosCorreoFlujo) => { asunto: string; parrafos: string[]; boton: string }> = {
  ENVIAR: (d) => ({
    asunto: `Syllabus por revisar: ${d.nombreCurso}`,
    parrafos: [
      `${d.actor} le envió el syllabus del curso ${d.nombreCurso} para que lo revise.`,
      'Puede publicarlo para los estudiantes o devolverlo con observaciones.',
    ],
    boton: 'Revisar el syllabus en Inkluye',
  }),
  DEVOLVER: (d) => ({
    asunto: `Syllabus devuelto con observaciones: ${d.nombreCurso}`,
    parrafos: [
      `${d.actor} revisó el syllabus del curso ${d.nombreCurso} y lo devolvió con observaciones.`,
      'Corrija lo indicado, genere el syllabus otra vez y vuelva a enviarlo.',
    ],
    boton: 'Ver el syllabus en Inkluye',
  }),
  PUBLICAR: (d) => ({
    asunto: `Syllabus publicado: ${d.nombreCurso}`,
    parrafos: [
      `${d.actor} publicó el syllabus del curso ${d.nombreCurso}.`,
      'Los estudiantes ya pueden verlo en Inkluye.',
    ],
    boton: 'Ver el syllabus en Inkluye',
  }),
};

export function construirCorreoFlujo(d: DatosCorreoFlujo): Correo {
  const c = CONTENIDO[d.accion](d);
  const observacion = d.accion === 'DEVOLVER' && d.observacion?.trim() ? d.observacion.trim() : null;

  const texto = [
    `Hola, ${d.destinatario}:`,
    '',
    ...c.parrafos,
    ...(observacion ? ['', 'Observaciones:', observacion] : []),
    '',
    `${c.boton}: ${d.enlace}`,
    '',
    '—',
    'Este correo lo envió automáticamente Inkluye, el sistema de gestión de syllabus.',
    'Puede ver todas sus notificaciones en la campanita del sistema.',
  ].join('\n');

  const p = (t: string) => `<p style="margin:0 0 16px;line-height:1.6">${escaparHtml(t)}</p>`;
  const html = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>${escaparHtml(c.asunto)}</title></head>
<body style="margin:0;padding:24px 16px;background:#ffffff;color:#14202b;font-family:Verdana,Arial,sans-serif;font-size:17px">
<div style="max-width:560px;margin:0 auto">
<h1 style="font-size:22px;line-height:1.3;margin:0 0 20px;color:#14202b">${escaparHtml(c.asunto)}</h1>
${p(`Hola, ${d.destinatario}:`)}
${c.parrafos.map(p).join('\n')}
${
  observacion
    ? `<h2 style="font-size:18px;margin:24px 0 8px">Observaciones</h2>
<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:6px solid #7a1428;background:#f8eaed;white-space:pre-wrap;line-height:1.6">${escaparHtml(observacion)}</blockquote>`
    : ''
}
<p style="margin:24px 0"><a href="${escaparHtml(d.enlace)}" style="display:inline-block;padding:12px 20px;background:#0b3a66;color:#ffffff;font-weight:bold;text-decoration:underline;border-radius:4px">${escaparHtml(c.boton)}</a></p>
<p style="margin:0 0 16px;line-height:1.6;color:#45515c;font-size:15px">Si el botón no funciona, copie esta dirección en su navegador: ${escaparHtml(d.enlace)}</p>
<hr style="border:0;border-top:1px solid #5b6773;margin:24px 0">
<p style="margin:0;line-height:1.6;color:#45515c;font-size:15px">Este correo lo envió automáticamente Inkluye, el sistema de gestión de syllabus. Puede ver todas sus notificaciones en la campanita del sistema.</p>
</div>
</body>
</html>`;

  return { asunto: c.asunto, texto, html };
}
