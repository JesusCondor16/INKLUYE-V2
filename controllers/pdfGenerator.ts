// controllers/pdfGenerator.ts
'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SyllabusLang, t } from '@/lib/i18n/syllabusLabels';

// El objeto curso llega de fuentes distintas (API generarSyllabus, o inyectado manualmente
// más abajo) y su forma real varía entre ellas — por eso el código prueba nombres de campo
// alternativos como curso.logro/curso.logros, curso.capacidad/curso.capacidades, etc. No se
// tipa como interfaz porque habría que declarar variantes duplicadas sin ganar seguridad real.
type Curso = any;
type Row = string[];
type Margins = { top: number; left: number; right: number; bottom: number };

// jspdf-autotable inyecta esta propiedad en runtime; el paquete 'jspdf' no la declara.
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export async function generarPDF(
  curso: Curso | number,
  competencias: any[] = [],
  logros: any[] = [],
  capacidades: any[] = [],
  programacion: any[] = [],
  lang: SyllabusLang = 'es',
  options?: { uploadToServer?: boolean; filename?: string }
) {
  // Si recibes solo un ID, intentamos cargar datos desde la API del syllabus
  if (typeof curso === 'number') {
    try {
      const res = await fetch(`/api/cursos/${curso}/generarSyllabus`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // preferimos la forma plana devuelta por el endpoint
        curso = data.curso ?? data;
        // si el endpoint devolvió arrays planos, los inyectamos
        competencias = (competencias && competencias.length) ? competencias : (data.competencias ?? data.competencia ?? []);
        logros = (logros && logros.length) ? logros : (data.logros ?? data.logro ?? []);
        capacidades = (capacidades && capacidades.length) ? capacidades : (data.capacidades ?? data.capacidad ?? []);
        programacion = (programacion && programacion.length) ? programacion : (data.programacion ?? []);
      } else {
        console.warn('generarPDF: no se pudo obtener curso desde API, status=', res.status);
        curso = {};
      }
    } catch (err) {
      console.warn('generarPDF: fetch curso falló', err);
      curso = {};
    }
  }

  // Inyectamos arrays sueltos en 'curso' si vinieron por separado (preferencia alta)
  curso = curso || {};
  if (Array.isArray(competencias) && competencias.length) curso.competencias = competencias;
  if (Array.isArray(logros) && logros.length) curso.logro = logros; // prisma usa 'logro'
  if (Array.isArray(capacidades) && capacidades.length) curso.capacidad = capacidades;
  if (Array.isArray(programacion) && programacion.length) curso.programacion = programacion;

  // Debug: ver qué tenemos antes de generar (quita en producción si quieres)
  // eslint-disable-next-line no-console
  console.log('generarPDF - objeto curso recibido:', JSON.parse(JSON.stringify(curso || {})));
  // eslint-disable-next-line no-console
  console.log('generarPDF - competencias.length=', Array.isArray(curso?.competencias) ? curso.competencias.length : 0);
  // eslint-disable-next-line no-console
  console.log('generarPDF - logros.length=', Array.isArray(curso?.logro || curso?.logros) ? (curso.logro || curso.logros).length : 0);
  // eslint-disable-next-line no-console
  console.log('generarPDF - capacidades.length=', Array.isArray(curso?.capacidad || curso?.capacidades) ? (curso.capacidad || curso.capacidades).length : 0);
  // eslint-disable-next-line no-console
  console.log('generarPDF - programacion.length=', Array.isArray(curso?.programacion) ? curso.programacion.length : 0);

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // Asegurar color de texto por si hubiera algún cambio de color previo
  doc.setTextColor(0, 0, 0);

  const MARGINS: Margins = { top: 15, left: 25, right: 25, bottom: 15 };
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let y = MARGINS.top;

  // BLOQUES (orden)
  y = await renderEncabezado(doc, y, pageWidth, MARGINS, lang);
  y = renderTitulo(doc, y, pageWidth, MARGINS, lang);
  y = renderInformacionGeneral(doc, y, curso, MARGINS, pageHeight, lang);
  y = renderSumilla(doc, y, curso, MARGINS, lang);
  y = await renderCompetencias(doc, y, curso, MARGINS, pageHeight, lang);
  y = await renderLogros(doc, y, curso, MARGINS, pageHeight, lang);
  y = await renderCapacidades(doc, y, curso, MARGINS, pageHeight, lang);
  y = await renderProgramacion(doc, y, curso, MARGINS, pageHeight, lang); // SECCIÓN 6: Programación de contenidos (tabla)
  y = await renderEstrategiaDidactica(doc, y, curso, MARGINS, pageHeight, lang); // SECCIÓN 7
  y = await renderRecursos(doc, y, curso, MARGINS, pageHeight, lang); // SECCIÓN 8
  y = await renderMatrizEvaluacion(doc, y, curso, MARGINS, pageHeight, lang); // SECCIÓN 9
  y = renderNotaEvaluacion(doc, y, MARGINS, pageHeight, lang); // SECCIÓN 9 — NOTA
  y = await renderBibliografia(doc, y, curso, MARGINS, pageHeight, lang); // SECCIÓN 10

  // Nombre por defecto
  const nombreCurso = sanitizeTextForPdf(curso?.name ?? 'Curso');
  const defaultFilename = `${t(lang, 'filenamePrefix')} - ${nombreCurso}.pdf`;

  // Si no se solicita upload, descargamos como antes
  if (!options?.uploadToServer) {
    doc.save(defaultFilename);
    return;
  }

  // --- Si se solicita uploadToServer: convertir a ArrayBuffer -> base64 y POST al server ---
  try {
    const arrayBuffer = doc.output('arraybuffer');
    const base64 = arrayBufferToBase64(arrayBuffer);

    // Determinar filename en servidor: preferencia options.filename, luego curso.id + idioma, luego default sanitized
    // Se incluye el idioma en el nombre para que ES/EN/ZH no se sobrescriban entre sí en disco.
    const serverFilename =
      options?.filename && typeof options.filename === 'string'
        ? options.filename
        : (typeof curso === 'object' && (curso.id || curso.courseId)) ? `${curso.id ?? curso.courseId}-${lang}.pdf` :
        `${sanitizeFilename(defaultFilename)}`;

    const cursoIdForUpload = (typeof curso === 'object' && (curso.id || curso.courseId)) ? (curso.id ?? curso.courseId) : (typeof curso === 'number' ? curso : null);

    if (!cursoIdForUpload) {
      console.warn('generarPDF: no se detectó courseId para upload; se realizará descarga local.');
      doc.save(defaultFilename);
      return;
    }

    const res = await fetch(`/api/cursos/${cursoIdForUpload}/uploadSyllabus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ filename: serverFilename, data: base64 }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error('generarPDF: uploadSyllabus falló:', res.status, text);
      // fallback: descargar localmente
      doc.save(defaultFilename);
      return;
    }

    const json = await res.json();
    // Abrir en nueva pestaña la url guardada en servidor (opcional)
    if (json?.url) {
      window.open(json.url, '_blank');
    }

    return json;
  } catch (err) {
    console.error('generarPDF: error en uploadToServer', err);
    // fallback: descarga local para no perder trabajo
    doc.save(defaultFilename);
    throw err;
  }
}

/* ------------------------------
   UTIL: helpers y funciones auxiliares
------------------------------ */

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Convierte ArrayBuffer a base64 en browser
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(slice));
  }
  // btoa funciona en browser
  return btoa(binary);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-\.]/gi, '_').slice(0, 200);
}

function sanitizeTextForPdf(s: unknown): string {
  if (s === null || s === undefined) return '';
  try {
    const str = String(s);
    return (str.normalize ? str.normalize('NFKC') : str)
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
      .replace(/\r\n|\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  } catch {
    return String(s).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
  }
}

/* ------------------------------
   ENCABEZADO / TÍTULO
------------------------------ */

async function renderEncabezado(doc: jsPDF, y: number, pageWidth: number, MARGINS: Margins, lang: SyllabusLang): Promise<number> {
  try {
    const logo = await loadImageAsBase64('/images/logo-unmsm.png');
    const W = 30, H = 30;
    doc.addImage(logo, 'PNG', pageWidth / 2 - W / 2, y - 30, W, H);
  } catch {
    // no hacemos nada si falla la carga de imagen
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(t(lang, 'universidad'), pageWidth / 2, y + 6, { align: 'center' });
  y += 8;

  doc.setFontSize(10);
  doc.text(t(lang, 'universidadSub'), pageWidth / 2, y + 2, { align: 'center' });
  y += 6;

  doc.setFontSize(11);
  doc.text(t(lang, 'facultad'), pageWidth / 2, y + 2, { align: 'center' });
  y += 6;

  doc.text(t(lang, 'escuela'), pageWidth / 2, y + 2, { align: 'center' });
  y += 12;

  return y;
}

function renderTitulo(doc: jsPDF, y: number, pageWidth: number, MARGINS: Margins, lang: SyllabusLang): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(t(lang, 'silabo'), pageWidth / 2, y, { align: 'center' });
  return y + 12;
}

/* ------------------------------
   SECCIÓN 1 — INFORMACIÓN GENERAL
------------------------------ */

function renderInformacionGeneral(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's1Titulo'), MARGINS.left, y);
  y += 9;

  const INDENT = MARGINS.left + 10;
  const VALUE_X = INDENT + 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const horasSem =
    curso?.hours ??
    ((Number(curso?.theoryHours ?? 0) + Number(curso?.practiceHours ?? 0)) || '-');
  const modalidad = curso?.mode ?? curso?.modality ?? '-';

  const rows = [
    { label: t(lang, 's1Nombre'), value: sanitizeTextForPdf(curso?.name ?? '-') },
    { label: t(lang, 's1Codigo'), value: sanitizeTextForPdf(curso?.code ?? '-') },
    { label: t(lang, 's1Tipo'), value: sanitizeTextForPdf(curso?.type ?? '-') },
    { label: t(lang, 's1Area'), value: sanitizeTextForPdf(curso?.area ?? '-') },
    { label: t(lang, 's1Semanas'), value: sanitizeTextForPdf(String(curso?.weeks ?? '-')) },
    { label: t(lang, 's1Horas'), value: sanitizeTextForPdf(String(horasSem ?? '-')) },
    { label: t(lang, 's1Semestre'), value: sanitizeTextForPdf(curso?.semester ?? '-') },
    { label: t(lang, 's1Ciclo'), value: sanitizeTextForPdf(curso?.cycle ?? '') },
    { label: t(lang, 's1Creditos'), value: sanitizeTextForPdf(String(curso?.credits ?? '-')) },
    { label: t(lang, 's1Modalidad'), value: sanitizeTextForPdf(modalidad) },
    {
      label: t(lang, 's1Prerrequisitos'),
      value: (curso?.prerequisites && curso.prerequisites.length)
        ? sanitizeTextForPdf(curso.prerequisites.map((p: any) => p.code ?? p.name ?? '').join(', '))
        : t(lang, 'ninguno'),
    },
    {
      label: t(lang, 's1Docentes'),
      value: (curso?.cursodocente && curso.cursodocente.length)
        ? sanitizeTextForPdf(curso.cursodocente.map((d: any) => d.name ?? d.fullname ?? d.email ?? '').join(', '))
        : t(lang, 'noAsignados'),
    },
  ];

  for (const r of rows) {
    const leftLines = doc.splitTextToSize(r.label + ':', 60);
    const rightLines = doc.splitTextToSize(String(r.value || '-'), 90);

    doc.text(leftLines, INDENT, y);
    doc.text(rightLines, VALUE_X + 2, y);

    const used = Math.max(leftLines.length, rightLines.length);
    y += used * 6;

    if (y > pageHeight - MARGINS.bottom - 10) {
      y = addFooterAndNewPage(doc, MARGINS); // usa y retornado
    }
  }

  return y + 6;
}

/* ------------------------------
   SECCIÓN 2 — SUMILLA
------------------------------ */

function renderSumilla(doc: jsPDF, y: number, curso: Curso, MARGINS: Margins, lang: SyllabusLang): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's2Titulo'), MARGINS.left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const text = sanitizeTextForPdf(curso?.sumilla ?? '-');
  const maxWidth = doc.internal.pageSize.getWidth() - (MARGINS.left + 10) - MARGINS.right;
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, MARGINS.left + 10, y);
  return y + lines.length * 6;
}

/* ------------------------------
   SECCIÓN 3 — COMPETENCIAS
------------------------------ */

async function renderCompetencias(doc: jsPDF, y: number, curso: Curso, MARGINS: Margins, pageHeight: number, lang: SyllabusLang) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's3Titulo'), MARGINS.left, y);
  y += 8;

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;

  const competencias = Array.isArray(curso?.competencias) ? curso.competencias : [];

  if (!competencias.length) {
    const noData = t(lang, 's3Vacio');
    const wrapped = doc.splitTextToSize(noData, contentWidth - 10);
    if (y + wrapped.length * 6 > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + 10, y);
    y += wrapped.length * 6 + 8;
    return y;
  }

  const body: Row[] = competencias.map((c: any) => [
    sanitizeTextForPdf(String(c.codigo ?? c.code ?? '')),
    sanitizeTextForPdf(String(c.descripcion ?? c.description ?? '')),
    sanitizeTextForPdf(String(c.tipo ?? c.type ?? '')),
    sanitizeTextForPdf(String(c.nivel ?? c.level ?? '')),
  ]);

  autoTable(doc, {
    startY: y,
    head: [[t(lang, 's3ColCodigo'), t(lang, 's3ColDescripcion'), t(lang, 's3ColTipo'), t(lang, 's3ColNivel')]],
    body,
    margin: { left: MARGINS.left, right: MARGINS.right },
    styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: Math.max(80, contentWidth - 30 - 30 - 30) },
      2: { cellWidth: 30 },
      3: { cellWidth: 30 },
    },
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable!.finalY + 8;

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 4 — LOGROS DE APRENDIZAJE (viñetas)
------------------------------ */

async function renderLogros(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's4Titulo'), MARGINS.left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const frase = t(lang, 's4Frase');
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  const fraseLines = doc.splitTextToSize(frase, contentWidth);
  doc.text(fraseLines, MARGINS.left, y);
  y += fraseLines.length * 6 + 4;

  const logros = Array.isArray(curso?.logro) && curso.logro.length
    ? curso.logro
    : Array.isArray(curso?.logros) && curso.logros.length
    ? curso.logros
    : [];

  // eslint-disable-next-line no-console
  console.log('renderLogros - encontrados:', (logros || []).length);

  const bullet = '-';
  const lineHeight = 6;
  const indent = 5;

  if (!logros.length) {
    const noData = t(lang, 's4Vacio');
    const wrapped = doc.splitTextToSize(noData, contentWidth - indent);
    if (y + wrapped.length * lineHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + 4;
    return y;
  }

  for (const logro of logros) {
    const codigo = sanitizeTextForPdf(String(logro?.codigo ?? logro?.code ?? ''));
    const descripcion = sanitizeTextForPdf(String(logro?.descripcion ?? logro?.description ?? ''));

    if (!codigo && !descripcion) continue;

    const textoCompleto = `${bullet} ${codigo}${codigo ? '.' : ''} ${descripcion}`.trim();
    const wrapped = doc.splitTextToSize(textoCompleto, contentWidth - indent);
    const estimatedHeight = wrapped.length * lineHeight + 2;

    if (y + estimatedHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }

    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + 2;
  }

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 5 — CAPACIDADES (Logros por unidad)
------------------------------ */

async function renderCapacidades(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's5Titulo'), MARGINS.left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const capacidades = Array.isArray(curso?.capacidad) && curso.capacidad.length
    ? curso.capacidad
    : Array.isArray(curso?.capacidades) && curso.capacidades.length
    ? curso.capacidades
    : [];

  // DEBUG: imprime contenido detalle de capacidades (quita en producción)
  // eslint-disable-next-line no-console
  console.log('DEBUG renderCapacidades - capacidades recibidas:', JSON.parse(JSON.stringify(capacidades)));

  const bullet = '-';
  const lineHeight = 6;
  const indent = 8;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;

  if (!capacidades.length) {
    const noData = t(lang, 's5Vacio');
    const wrapped = doc.splitTextToSize(noData, contentWidth - indent);
    if (y + wrapped.length * lineHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + 4;
    return y;
  }

  for (let i = 0; i < capacidades.length; i++) {
    const c = capacidades[i];

    // Loguear cada campo individual (útil para detectar campos vacíos o malformados)
    // eslint-disable-next-line no-console
    console.log(`capacidad[${i}] raw:`, c);

    const nombreRaw = (c && (c.nombre ?? c.name)) ?? '';
    const descripcionRaw = (c && (c.descripcion ?? c.description)) ?? '';

    const sanitize = (v: unknown) => {
      if (v === null || v === undefined) return '';
      try {
        const s = String(v);
        const n = s.normalize ? s.normalize('NFKC') : s;
        return n
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
          .replace(/\r\n|\r/g, '\n')
          .replace(/\t/g, ' ')
          .replace(/\u00A0/g, ' ')
          .replace(/[ ]{2,}/g, ' ')
          .trim();
      } catch {
        return String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
      }
    };

    const nombre = sanitize(nombreRaw);
    const descripcion = sanitize(descripcionRaw);

    if (!nombre && !descripcion) {
      // eslint-disable-next-line no-console
      console.warn(`renderCapacidades: capacidad[${i}] tiene nombre y descripción vacíos, se omite.`);
      continue;
    }

    const combined = nombre ? `${bullet} ${nombre}: ${descripcion}` : `${bullet} ${descripcion}`;
    const wrapped = doc.splitTextToSize(combined, contentWidth - indent);

    const estimatedHeight = wrapped.length * lineHeight + 4;
    if (y + estimatedHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + 4;
  }

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 6 — PROGRAMACIÓN DE CONTENIDOS (tabla)
------------------------------ */

async function renderProgramacion(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's6Titulo'), MARGINS.left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let rowsSource: any[] = [];
  if (Array.isArray(curso?.programacion) && curso.programacion.length) rowsSource = curso.programacion;
  else if (Array.isArray(curso?.programacioncontenido) && curso.programacioncontenido.length) rowsSource = curso.programacioncontenido;
  else if (Array.isArray(curso?.programacionContenido) && curso.programacionContenido.length) rowsSource = curso.programacionContenido;
  else if (Array.isArray(curso?.programacionContenidoList) && curso.programacionContenidoList.length) rowsSource = curso.programacionContenidoList;
  else rowsSource = [];

  if (!rowsSource.length) {
    const noData = t(lang, 's6Vacio');
    const wrapped = doc.splitTextToSize(noData, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right - 10);
    if (y + wrapped.length * 6 > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + 10, y);
    y += wrapped.length * 6 + 6;
    return y;
  }

  const extractSessionNumber = (p: any): number | null => {
    const raw = (p?.sesion ?? p?.sesionText ?? p?.semana ?? p?.logroUnidad ?? p?.unidad ?? '').toString().trim();
    if (!raw) return null;
    const m = raw.match(/(\d+)/);
    if (m && m[1]) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n)) return n;
    }
    const roman = raw.toUpperCase().match(/^(M{0,4}(CM)?(D)?(CD)?C{0,3}(XC)?(L)?(XL)?X{0,3}(IX)?(V)?(IV)?I{0,3})$/);
    if (roman) {
      const romans: Record<string, number> = {
        I:1, II:2, III:3, IV:4, V:5, VI:6, VII:7, VIII:8, IX:9, X:10,
        XI:11, XII:12, XIII:13, XIV:14, XV:15, XVI:16, XVII:17, XVIII:18, XIX:19, XX:20
      };
      const v = romans[raw.toUpperCase()];
      if (v) return v;
    }
    return null;
  };

  const rowsSorted = [...rowsSource].sort((a: any, b: any) => {
    const na = extractSessionNumber(a);
    const nb = extractSessionNumber(b);

    if (na !== null && nb !== null) return na - nb;
    if (na !== null) return -1;
    if (nb !== null) return 1;

    const ta = (a?.semana ?? a?.logroUnidad ?? a?.unidad ?? '').toString();
    const tb = (b?.semana ?? b?.logroUnidad ?? b?.unidad ?? '').toString();
    return ta.localeCompare(tb, undefined, { numeric: true, sensitivity: 'base' });
  });

  const body: Row[] = rowsSorted.map((p: any, idx: number) => {
    const sesionRaw = p.semana ?? p.sesion ?? p.logroUnidad ?? p.unidad ?? String(idx + 1);
    const sesion = sanitizeTextForPdf(sesionRaw);

    const contenido = sanitizeTextForPdf(p.contenido ?? p.tema ?? p.descripcion ?? p.contenidoTema ?? '');
    const actividades = sanitizeTextForPdf(p.actividades ?? p.actividad ?? '');
    const recursos = sanitizeTextForPdf(p.recursos ?? p.recurso ?? p.recursosList ?? '');
    const estrategias = sanitizeTextForPdf(p.estrategias ?? p.estrategia ?? p.estrategiasDidacticas ?? '');

    return [sesion, contenido, actividades, recursos, estrategias];
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;

  autoTable(doc, {
    startY: y,
    head: [[t(lang, 's6ColSesion'), t(lang, 's6ColContenido'), t(lang, 's6ColActividades'), t(lang, 's6ColRecursos'), t(lang, 's6ColEstrategias')]],
    body,
    margin: { left: MARGINS.left, right: MARGINS.right },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [230, 230, 230], textColor: 20, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: Math.max(30, Math.floor(contentWidth * 0.25)) },
      2: { cellWidth: Math.max(30, Math.floor(contentWidth * 0.24)) },
      3: { cellWidth: Math.max(30, Math.floor(contentWidth * 0.24)) },
      4: { cellWidth: Math.max(30, Math.floor(contentWidth * 0.23)) },
    },
    didDrawPage: () => {
      // opcional
    },
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable!.finalY + 8;

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 7 — ESTRATEGIA DIDÁCTICA
------------------------------ */

async function renderEstrategiaDidactica(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's7Titulo'), MARGINS.left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const estrategias =
    Array.isArray(curso?.estrategiadidactica) && curso.estrategiadidactica.length
      ? curso.estrategiadidactica
      : Array.isArray(curso?.estrategiasdidacticas) && curso.estrategiasdidacticas.length
      ? curso.estrategiasdidacticas
      : [];

  // DEBUG
  // eslint-disable-next-line no-console
  console.log('DEBUG renderEstrategiaDidactica - estrategias recibidas:', JSON.parse(JSON.stringify(estrategias)));

  const lineHeight = 6;
  const paragraphSpacing = 4;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  const indent = 0;

  const sanitize = (v: unknown) => {
    if (v === null || v === undefined) return '';
    try {
      const s = String(v);
      const n = s.normalize ? s.normalize('NFKC') : s;
      return n
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/[ ]{2,}/g, ' ')
        .trim();
    } catch {
      return String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    }
  };

  if (!estrategias.length) {
    const noData = t(lang, 's7Vacio');
    const wrapped = doc.splitTextToSize(noData, contentWidth - indent);
    if (y + wrapped.length * lineHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + 4;
    return y;
  }

  for (let i = 0; i < estrategias.length; i++) {
    const e = estrategias[i];

    // eslint-disable-next-line no-console
    console.log(`estrategia[${i}] raw:`, e);

    const textoRaw = (e && (e.texto ?? e.text ?? '')) ?? '';
    const texto = sanitize(textoRaw);

    if (!texto) {
      // eslint-disable-next-line no-console
      console.warn(`renderEstrategiaDidactica: estrategia[${i}] texto vacío, se omite.`);
      continue;
    }

    const paragraphs = texto.split(/\n{2,}/).map(p => p.split('\n').join(' ').trim()).filter(Boolean);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];
      const wrapped = doc.splitTextToSize(paragraph, contentWidth - indent);
      const estimatedHeight = wrapped.length * lineHeight + paragraphSpacing;

      if (y + estimatedHeight > pageHeight - MARGINS.bottom) {
        y = addFooterAndNewPage(doc, MARGINS);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(wrapped, MARGINS.left + indent, y);
      y += wrapped.length * lineHeight + paragraphSpacing;
    }

    y += 2;
  }

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 8 — RECURSOS
------------------------------ */

async function renderRecursos(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's8Titulo'), MARGINS.left, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const recursos =
    Array.isArray(curso?.recurso) && curso.recurso.length
      ? curso.recurso
      : Array.isArray(curso?.recursos) && curso.recursos.length
      ? curso.recursos
      : [];

  // DEBUG
  // eslint-disable-next-line no-console
  console.log('DEBUG renderRecursos - recursos recibidos:', JSON.parse(JSON.stringify(recursos)));

  const lineHeight = 6;
  const paragraphSpacing = 0;
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  const indent = 0;

  const sanitize = (v: unknown) => {
    if (v === null || v === undefined) return '';
    try {
      const s = String(v);
      const n = s.normalize ? s.normalize('NFKC') : s;
      return n
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/[ ]{2,}/g, ' ')
        .trim();
    } catch {
      return String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    }
  };

  if (!recursos.length) {
    const noData = t(lang, 's8Vacio');
    const wrapped = doc.splitTextToSize(noData, contentWidth - indent);
    if (y + wrapped.length * lineHeight > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left + indent, y);
    y += wrapped.length * lineHeight + paragraphSpacing;
    return y;
  }

  for (let i = 0; i < recursos.length; i++) {
    const r = recursos[i];

    // eslint-disable-next-line no-console
    console.log(`recurso[${i}] raw:`, r);

    const textoRaw = (r && (r.descripcion ?? r.text ?? '')) ?? '';
    const texto = sanitize(textoRaw);

    if (!texto) {
      // eslint-disable-next-line no-console
      console.warn(`renderRecursos: recurso[${i}] texto vacío, se omite.`);
      continue;
    }

    const paragraphs = texto.split(/\n{2,}/).map(p => p.split('\n').join(' ').trim()).filter(Boolean);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];
      const wrapped = doc.splitTextToSize(paragraph, contentWidth - indent);
      const estimatedHeight = wrapped.length * lineHeight + paragraphSpacing;

      if (y + estimatedHeight > pageHeight - MARGINS.bottom) {
        y = addFooterAndNewPage(doc, MARGINS);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(wrapped, MARGINS.left + indent, y);
      y += wrapped.length * lineHeight + paragraphSpacing;
    }

    y += 1;
  }

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   SECCIÓN 9 — MATRIZ DE EVALUACIÓN
------------------------------ */

async function renderMatrizEvaluacion(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's9Titulo'), MARGINS.left, y);
  y += 6;

  const matriz =
    Array.isArray(curso?.matriz) && curso.matriz.length
      ? curso.matriz
      : Array.isArray(curso?.matrizevaluacion) && curso.matrizevaluacion.length
      ? curso.matrizevaluacion
      : [];

  if (!matriz.length) {
    const noData = t(lang, 's9Vacio');
    const wrapped = doc.splitTextToSize(noData, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(wrapped, MARGINS.left, y);
    y += wrapped.length * 6 + 4;
    return y;
  }

  const sanitize = (v: unknown) =>
    v === null || v === undefined ? '' : String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();

  const tableData = matriz.map((m: any) => [
    sanitize(m.unidad),
    sanitize(m.criterio),
    sanitize(m.producto),
    sanitize(m.instrumento),
    sanitize(m.nota_peso ?? ''),
    sanitize(m.nota_sum ?? ''),
  ]);

  const totalPeso = matriz.reduce((acc: number, m: any) => acc + (Number(m.nota_peso) || 0), 0);

  autoTable(doc, {
    startY: y,
    head: [
      [
        { content: t(lang, 's9ColUnidad'), rowSpan: 2 },
        { content: t(lang, 's9ColCriterios'), rowSpan: 2 },
        { content: t(lang, 's9ColProducto'), rowSpan: 2 },
        { content: t(lang, 's9ColInstrumento'), rowSpan: 2 },
        { content: t(lang, 's9ColNota'), colSpan: 2, styles: { halign: 'center' } },
      ],
      [
        { content: t(lang, 's9ColPeso') },
        { content: t(lang, 's9ColSum') },
      ],
    ],
    body: tableData,
    foot: [[
      { content: t(lang, 's9Total'), colSpan: 4, styles: { fontStyle: 'bold', halign: 'right' } },
      { content: `${totalPeso}%`, styles: { fontStyle: 'bold', halign: 'center' } },
      { content: '' },
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: 0,
    },
    bodyStyles: {
      font: 'helvetica',
      fontSize: 10,
      valign: 'top',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 56 },
      2: { cellWidth: 30 },
      3: { cellWidth: 40 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
    },
    margin: { left: MARGINS.left, right: MARGINS.right },
    didDrawPage: function (data) {
      if (data.cursor) y = data.cursor.y + 4;
    }
  });

  y = (doc as jsPDFWithAutoTable).lastAutoTable?.finalY ?? y;
  y += 6;

  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;
  const formula = t(lang, 's9FormulaPrefix') + matriz
    .map((m: any) => `${sanitize(m.nota_sum)}*${((Number(m.nota_peso) || 0) / 100).toFixed(2)}`)
    .join(' + ');

  if (y > pageHeight - MARGINS.bottom - 10) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const wrappedFormula = doc.splitTextToSize(formula, contentWidth);
  doc.text(wrappedFormula, MARGINS.left, y);
  y += wrappedFormula.length * 6 + 4;

  return y;
}

function renderNotaEvaluacion(doc: jsPDF, y: number, MARGINS: Margins, pageHeight: number, lang: SyllabusLang): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGINS.left - MARGINS.right;

  if (y > pageHeight - MARGINS.bottom - 20) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(t(lang, 's9NotaTitulo'), MARGINS.left, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const notas = [t(lang, 's9Nota1'), t(lang, 's9Nota2'), t(lang, 's9Nota3')];
  for (const nota of notas) {
    const wrapped = doc.splitTextToSize(nota, contentWidth);
    if (y + wrapped.length * 6 > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left, y);
    y += wrapped.length * 6 + 3;
  }

  return y + 4;
}

/* ------------------------------
   SECCIÓN 10 — BIBLIOGRAFÍA
------------------------------ */

async function renderBibliografia(
  doc: jsPDF,
  y: number,
  curso: Curso,
  MARGINS: Margins,
  pageHeight: number,
  lang: SyllabusLang
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(t(lang, 's10Titulo'), MARGINS.left, y + 15);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const bibliografias =
    Array.isArray(curso?.bibliografia) && curso.bibliografia.length
      ? curso.bibliografia
      : Array.isArray(curso?.bibliografias) && curso.bibliografias.length
      ? curso.bibliografias
      : [];

  const sanitize = (v: unknown) => {
    if (v === null || v === undefined) return '';
    try {
      const s = String(v);
      const n = s.normalize ? s.normalize('NFKC') : s;
      return n
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\u00A0/g, ' ')
        .replace(/[ ]{2,}/g, ' ')
        .trim();
    } catch {
      return String(v).replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
    }
  };

  if (!bibliografias.length) {
    const noData = t(lang, 's10Vacio');
    const wrapped = doc.splitTextToSize(noData, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right);
    if (y + wrapped.length * 6 > pageHeight - MARGINS.bottom) {
      y = addFooterAndNewPage(doc, MARGINS);
    }
    doc.text(wrapped, MARGINS.left, y);
    y += wrapped.length * 6 + 4;
    return y;
  }

  for (let i = 0; i < bibliografias.length; i++) {
    const b = bibliografias[i];
    const textoRaw = (b && (b.texto ?? b.text ?? '')) ?? '';
    const texto = sanitize(textoRaw);

    if (!texto) continue;

    const paragraphs = texto.split(/\n{2,}/).map(p => p.split('\n').join(' ').trim()).filter(Boolean);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];
      const wrapped = doc.splitTextToSize(paragraph, doc.internal.pageSize.getWidth() - MARGINS.left - MARGINS.right);
      const estimatedHeight = wrapped.length * 6 + 10;

      if (y + estimatedHeight > pageHeight - MARGINS.bottom) {
        y = addFooterAndNewPage(doc, MARGINS);
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(wrapped, MARGINS.left, y);
      y += wrapped.length * 6 + 2;
    }

    y += 2;
  }

  if (y > pageHeight - MARGINS.bottom) {
    y = addFooterAndNewPage(doc, MARGINS);
  }

  return y;
}

/* ------------------------------
   UTILIDADES: footer + nueva página y carga de imagen
------------------------------ */

function addFooterAndNewPage(doc: jsPDF, margins: Margins): number {
  const page = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setLineWidth(0.3);
  doc.line(margins.left, pageHeight - margins.bottom + 6, pageWidth - margins.right, pageHeight - margins.bottom + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  const pageNumberText = String(page);
  const textWidth = doc.getTextWidth(pageNumberText);
  doc.text(pageNumberText, pageWidth - margins.right - textWidth, pageHeight - margins.bottom + 14);

  doc.addPage();
  return margins.top;
}

async function loadImageAsBase64(path: string): Promise<string> {
  const res = await fetch(path);
  if (!res.ok) throw new Error('No se pudo cargar imagen');
  const blob = await res.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}