// lib/correo/plantillas.ts
// Correos del flujo del syllabus con la identidad de Inkluye (azul marino y amarillo del logo).
// Funcion pura: se prueba con Jest.
//
// Accesibilidad (WCAG 2.1 AAA aplicado al correo):
//  - lang="es", un solo h1, titulos h2 para cada bloque, tablas de diseño con role="presentation"
//  - todos los colores de texto con contraste 7:1 o mas (1.4.6); el estado se dice con texto, no solo con color (1.4.1)
//  - letra de 17 px, interlineado 1.6 y ancho maximo de 600 px (~65 caracteres por linea, 1.4.8)
//  - boton de 48 px de alto con texto que dice a donde lleva (2.4.4, 2.5.5) y la direccion escrita debajo
//  - logo con texto alternativo; si el lector de correo bloquea imagenes, el nombre "Inkluye" sigue visible
//  - siempre hay una version en texto plano para lectores de correo que no muestran HTML
// Se usan tablas y estilos en linea porque Gmail y Outlook no soportan CSS moderno.
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

/** Identificador del logo adjunto dentro del correo (lib/correo/enviar.ts lo adjunta) */
export const CID_LOGO = 'logo-inkluye';

// Paleta del logo de Inkluye. Contrastes calculados (WCAG 2.1):
const C = {
  marino: '#062848', // azul del logo: 14.9:1 con blanco
  amarillo: '#FDC922', // amarillo del logo: 9.6:1 con el azul marino
  texto: '#14202B', // 16.5:1 sobre blanco
  gris: '#45515C', // 8.1:1 sobre blanco
  fondo: '#F4F6F9',
  blanco: '#FFFFFF',
  azulSuave: '#E8EEF6', // marino sobre azulSuave: 12.8:1
  guinda: '#7A1428', // 9.2:1 sobre guindaSuave
  guindaSuave: '#F8EAED',
  verde: '#0B3D1A', // 10.6:1 sobre verdeSuave
  verdeSuave: '#E3F1E6',
};

const FUENTE = "Verdana, 'Segoe UI', Arial, sans-serif";

interface Contenido {
  asunto: string;
  etiqueta: string; // estado en texto (no solo color)
  colorEtiqueta: string;
  fondoEtiqueta: string;
  titulo: string;
  parrafos: string[];
  boton: string;
  siguiente: string; // que debe hacer la persona ahora
}

const CONTENIDO: Record<AccionCorreo, (d: DatosCorreoFlujo) => Contenido> = {
  ENVIAR: (d) => ({
    asunto: `Syllabus por revisar: ${d.nombreCurso}`,
    etiqueta: 'Por revisar',
    colorEtiqueta: C.marino,
    fondoEtiqueta: C.amarillo,
    titulo: 'Tiene un syllabus por revisar',
    parrafos: [`${d.actor} le envió el syllabus del curso para que lo revise.`],
    boton: 'Revisar el syllabus en Inkluye',
    siguiente: 'Revíselo y elija una opción: publicarlo para los estudiantes o devolverlo con observaciones.',
  }),
  DEVOLVER: (d) => ({
    asunto: `Syllabus devuelto con observaciones: ${d.nombreCurso}`,
    etiqueta: 'Devuelto con observaciones',
    colorEtiqueta: C.guinda,
    fondoEtiqueta: C.guindaSuave,
    titulo: 'Su syllabus tiene observaciones',
    parrafos: [`${d.actor} revisó el syllabus del curso y lo devolvió con observaciones.`],
    boton: 'Ver el syllabus en Inkluye',
    siguiente: 'Corrija lo indicado, genere el syllabus otra vez y vuelva a enviarlo a revisión.',
  }),
  PUBLICAR: (d) => ({
    asunto: `Syllabus publicado: ${d.nombreCurso}`,
    etiqueta: 'Publicado',
    colorEtiqueta: C.verde,
    fondoEtiqueta: C.verdeSuave,
    titulo: 'Su syllabus ya fue publicado',
    parrafos: [`${d.actor} aprobó y publicó el syllabus del curso.`],
    boton: 'Ver el syllabus en Inkluye',
    siguiente: 'No necesita hacer nada más. Los estudiantes ya pueden verlo en Inkluye.',
  }),
};

export function construirCorreoFlujo(d: DatosCorreoFlujo): Correo {
  const c = CONTENIDO[d.accion](d);
  const observacion = d.accion === 'DEVOLVER' && d.observacion?.trim() ? d.observacion.trim() : null;
  const e = escaparHtml;

  // ---------------- Texto plano
  const texto = [
    `Hola, ${d.destinatario}:`,
    '',
    `Estado: ${c.etiqueta}`,
    `Curso: ${d.nombreCurso}`,
    '',
    ...c.parrafos,
    ...(observacion ? ['', 'Observaciones:', observacion] : []),
    '',
    `Qué sigue: ${c.siguiente}`,
    '',
    `${c.boton}: ${d.enlace}`,
    '',
    '—',
    'Este correo lo envió automáticamente Inkluye, el sistema de gestión de syllabus.',
    'Puede ver todas sus notificaciones en la campanita del sistema.',
  ].join('\n');

  // ---------------- HTML
  const p = (t: string, extra = '') =>
    `<p style="margin:0 0 16px;font-family:${FUENTE};font-size:17px;line-height:1.6;color:${C.texto}${extra}">${e(t)}</p>`;

  const bloqueObservaciones = observacion
    ? `<tr><td style="padding:8px 32px 8px">
  <h2 style="margin:0 0 8px;font-family:${FUENTE};font-size:18px;line-height:1.4;color:${C.guinda}">Observaciones</h2>
  <div style="margin:0;padding:16px 20px;border-left:6px solid ${C.guinda};background:${C.guindaSuave};font-family:${FUENTE};font-size:17px;line-height:1.6;color:${C.texto};white-space:pre-wrap">${e(observacion)}</div>
</td></tr>`
    : '';

  const html = `<!doctype html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${e(c.asunto)}</title>
</head>
<body style="margin:0;padding:0;background:${C.fondo}">
<!-- Resumen que algunos lectores de correo muestran junto al asunto -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${e(`${c.etiqueta}: ${d.nombreCurso}. ${c.siguiente}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.fondo}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${C.blanco};border:1px solid #5B6773;border-radius:8px;overflow:hidden">

<!-- Encabezado con la marca -->
<tr><td style="background:${C.marino};padding:20px 32px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:${C.blanco};border-radius:8px;padding:4px;width:48px;height:48px" valign="middle">
      <img src="cid:${CID_LOGO}" width="48" height="48" alt="Logo de Inkluye" style="display:block;border:0">
    </td>
    <td style="padding-left:14px" valign="middle">
      <p style="margin:0;font-family:${FUENTE};font-size:24px;font-weight:bold;line-height:1.2;color:${C.blanco}">Inkluye</p>
      <p style="margin:2px 0 0;font-family:${FUENTE};font-size:15px;line-height:1.4;color:${C.amarillo}">Sistema de gestión de syllabus</p>
    </td>
  </tr></table>
</td></tr>
<tr><td style="background:${C.amarillo};height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>

<!-- Estado, titulo y saludo -->
<tr><td style="padding:28px 32px 0">
  <p style="margin:0 0 16px"><span style="display:inline-block;padding:6px 14px;border-radius:999px;background:${c.fondoEtiqueta};border:2px solid ${c.colorEtiqueta};font-family:${FUENTE};font-size:15px;font-weight:bold;color:${c.colorEtiqueta}">Estado: ${e(c.etiqueta)}</span></p>
  <h1 style="margin:0 0 20px;font-family:${FUENTE};font-size:26px;line-height:1.3;color:${C.marino}">${e(c.titulo)}</h1>
  ${p(`Hola, ${d.destinatario}:`)}
  ${c.parrafos.map((t) => p(t)).join('\n  ')}
</td></tr>

<!-- Datos del curso -->
<tr><td style="padding:0 32px 8px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.azulSuave};border-left:6px solid ${C.marino};border-radius:4px">
    <tr><td style="padding:16px 20px">
      <p style="margin:0 0 4px;font-family:${FUENTE};font-size:15px;line-height:1.4;color:${C.marino};font-weight:bold">Curso</p>
      <p style="margin:0;font-family:${FUENTE};font-size:17px;line-height:1.5;color:${C.texto}">${e(d.nombreCurso)}</p>
    </td></tr>
  </table>
</td></tr>

${bloqueObservaciones}

<!-- Que sigue -->
<tr><td style="padding:16px 32px 0">
  <h2 style="margin:0 0 8px;font-family:${FUENTE};font-size:18px;line-height:1.4;color:${C.marino}">Qué sigue</h2>
  ${p(c.siguiente)}
</td></tr>

<!-- Boton (48 px de alto) -->
<tr><td style="padding:8px 32px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td style="background:${C.marino};border-radius:6px;border-bottom:4px solid ${C.amarillo}">
      <a href="${e(d.enlace)}" style="display:inline-block;padding:14px 28px;min-height:20px;font-family:${FUENTE};font-size:17px;font-weight:bold;line-height:1.2;color:${C.blanco};text-decoration:underline">${e(c.boton)}</a>
    </td>
  </tr></table>
  <p style="margin:16px 0 0;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.gris}">Si el botón no funciona, copie esta dirección en su navegador:<br><span style="color:${C.texto};word-break:break-all">${e(d.enlace)}</span></p>
</td></tr>

<!-- Pie -->
<tr><td style="padding:28px 32px 0"><hr style="border:0;border-top:1px solid #5B6773;margin:0"></td></tr>
<tr><td style="padding:16px 32px 28px">
  <p style="margin:0 0 8px;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.gris}">Este correo lo envió automáticamente Inkluye, el sistema de gestión de syllabus. Puede ver todas sus notificaciones en la campanita del sistema.</p>
  <p style="margin:0;font-family:${FUENTE};font-size:15px;line-height:1.6;color:${C.gris}">Universidad Nacional Mayor de San Marcos · Facultad de Ingeniería de Sistemas e Informática</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

  return { asunto: c.asunto, texto, html };
}
