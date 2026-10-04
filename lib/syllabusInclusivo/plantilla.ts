// lib/syllabusInclusivo/plantilla.ts
// Arma el HTML del "Syllabus inclusivo": un documento que cumple WCAG 2.1 AAA.
// El mismo HTML se muestra como pagina y se convierte en PDF etiquetado (PDF/UA).
// Funcion pura: recibe los datos y devuelve texto; se prueba con Jest.
import { TERMINOS, SIGLAS, definicion } from '@/lib/glosario';
import type { DatosSyllabusInclusivo } from './tipos';
import {
  aGrupos,
  agruparSemanas,
  escaparHtml,
  etiquetaSemanas,
  normalizarEspacios,
  numeroSemana,
  sinDuplicados,
  type GrupoLista,
} from './textos';

const CATEGORIAS: Record<string, string> = {
  SOBRE_LA_TESIS: 'Sobre la tesis',
  REVISTAS_INDEXADAS: 'Revistas científicas indexadas',
  LIBROS_DIGITALES: 'Libros digitales',
  BANCO_DE_TESIS: 'Banco de tesis',
  OTRAS_FUENTES: 'Otras fuentes',
};

// Siglas propias de los syllabus (WCAG 2.1 - 3.1.4). Solo se listan las que aparecen en el texto.
export const SIGLAS_SYLLABUS: Record<string, string> = {
  RA: 'Resultado de aprendizaje',
  CG: 'Competencia general',
  CT: 'Competencia técnica',
  APA: 'Normas de la American Psychological Association para citar fuentes',
  UNMSM: 'Universidad Nacional Mayor de San Marcos',
};

/** Escapa el texto y marca las siglas conocidas con <abbr title> (tecnica H28) */
function texto(valor: string | null | undefined): string {
  const limpio = escaparHtml(normalizarEspacios(valor));
  return limpio.replace(/\b(RA|APA|UNMSM)(?=\d|\b)/g, (s) => `<abbr title="${SIGLAS_SYLLABUS[s]}">${s}</abbr>`);
}

function siglasUsadas(d: DatosSyllabusInclusivo): string[] {
  const todo = JSON.stringify(d);
  return Object.keys(SIGLAS_SYLLABUS).filter((s) => new RegExp(`\\b${s}(?=\\d|\\b)`).test(todo));
}

/** Linea de ayuda bajo el titulo de cada seccion (3.1.3 y 3.3.5) */
function ayuda(id: string): string {
  const e = definicion(id);
  return `<p class="ayuda"><dfn>${escaparHtml(e.termino)}</dfn>: ${escaparHtml(e.definicion)}</p>`;
}

function grupos(lista: GrupoLista[]): string {
  if (!lista.length) return '<p>No registrado.</p>';
  const items = lista.flatMap((g) =>
    g.titulo
      ? [`<li>${texto(g.titulo)}: ${g.items.map(texto).join('; ')}${g.items.length && !/[.!?]$/.test(g.items[g.items.length - 1]) ? '.' : ''}</li>`]
      : g.items.map((i) => `<li>${texto(i)}</li>`),
  );
  return `<ul>${items.join('')}</ul>`;
}

function seccion(num: string, id: string, titulo: string, cuerpo: string): string {
  return `<section id="${id}" aria-labelledby="${id}-t">
  <h2 class="sec" id="${id}-t"><span class="num">${num}</span>${escaparHtml(titulo)}</h2>
  ${cuerpo}
</section>`;
}

function horasPorSemana(c: DatosSyllabusInclusivo['curso']): number {
  return (c.theoryHours ?? 0) + (c.practiceHours ?? 0) + (c.labHours ?? 0);
}

/** Version en lenguaje sencillo, armada con los datos (WCAG 2.1 - 3.1.5, tecnica G86) */
export function resumenSencillo(d: DatosSyllabusInclusivo): string[] {
  const c = d.curso;
  const lineas: string[] = [];
  const partes: string[] = [];
  if (c.weeks) partes.push(`Dura ${c.weeks} semanas`);
  const horas = horasPorSemana(c);
  if (horas) partes.push(`con ${horas} ${horas === 1 ? 'hora' : 'horas'} de clase por semana`);
  if (partes.length) lineas.push(`${partes.join(', ')}.`);
  if (c.credits) lineas.push(`Vale ${c.credits} ${c.credits === 1 ? 'crédito' : 'créditos'}.`);
  if (d.capacidades.length) {
    lineas.push(`Tiene ${d.capacidades.length} ${d.capacidades.length === 1 ? 'unidad' : 'unidades'}.`);
  }
  const conPeso = d.matriz.filter((m) => m.peso);
  if (conPeso.length) {
    const lista = conPeso.map((m) => `${normalizarEspacios(m.producto).toLowerCase()} (${m.peso} %)`);
    const ultimo = lista.pop();
    lineas.push(`Tu nota sale de: ${lista.length ? `${lista.join(', ')} y ${ultimo}` : ultimo}.`);
  }
  return lineas;
}

// WCAG 2.1 - 1.4.10 (reajuste a 320 px): las columnas usan min(14rem,100%) y las palabras largas
// (p. ej. direcciones web de la bibliografia) se pueden partir con overflow-wrap:anywhere
const ESTILOS = `
:root{--bg:#f4f6f8;--paper:#fff;--fg:#14202b;--muted:#45515c;--accent:#7a1428;--accent-bg:#f8eaed;--link:#0b3a66;--line:#5b6773;
--font:"Atkinson Hyperlegible Next","Atkinson Hyperlegible",Verdana,"Segoe UI",sans-serif;--mono:"Atkinson Hyperlegible Mono",Consolas,monospace;--measure:68ch}
@media (prefers-color-scheme:dark){:root{--bg:#0e151c;--paper:#16202a;--fg:#eef2f6;--muted:#c2ccd6;--accent:#ffb3c0;--accent-bg:#3a1a22;--link:#a9d1ff;--line:#8c99a6;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font);font-size:1.125rem;line-height:1.6;padding:0 16px 3rem}
p,li,dd{max-width:var(--measure);overflow-wrap:anywhere}p{margin:0 0 1.6em}
h1,h2,h3,h4{line-height:1.25;text-wrap:balance}
a{color:var(--link);text-underline-offset:.18em}
abbr[title]{text-decoration:underline dotted;text-underline-offset:.2em}
dfn{font-style:normal;font-weight:700}
:focus-visible{outline:3px solid var(--accent);outline-offset:3px}
.saltar{position:absolute;left:16px;top:-100px;background:var(--paper);color:var(--link);padding:.75rem 1rem;border:2px solid var(--accent);font-weight:700}
.saltar:focus{top:1rem}
.hoja{max-width:52rem;margin:1rem auto 0;background:var(--paper);border:1px solid var(--line);border-top:8px solid var(--accent);border-radius:4px;padding:clamp(1.25rem,4vw,3.5rem)}
.membrete p{margin:0;color:var(--muted);font-size:.95rem}
.membrete .universidad{color:var(--fg);font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:.9rem}
.membrete{padding-bottom:1.25rem;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
.membrete img{width:72px;height:72px;flex-shrink:0}
.membrete .textos{display:grid;gap:.25rem;min-width:0}
h1{font-size:clamp(1.9rem,5vw,2.6rem);margin:1.5rem 0 .4rem}
h1 .tipo{display:block;font-size:1rem;letter-spacing:.08em;text-transform:uppercase;color:var(--accent);margin-bottom:.4rem}
.subtitulo{color:var(--muted)}
.sencillo{background:var(--accent-bg);border-left:6px solid var(--accent);padding:1.25rem 1.5rem;margin:0 0 2.5rem}
.sencillo h2{margin-top:0;font-size:1.25rem}
.sencillo ul{margin:0;padding-left:1.25rem}
.indice{border:1px solid var(--line);border-radius:4px;padding:1.25rem 1.5rem;margin-bottom:3rem}
.indice h2{margin:0 0 .75rem;font-size:1.15rem}
.indice ol{margin:0;padding-left:1.5rem;columns:2 15rem;column-gap:2.5rem}
.indice li{break-inside:avoid}
.indice a{display:inline-block;min-height:44px;padding-block:.55rem}
section{margin-bottom:3rem}
h2.sec{font-size:1.6rem;margin:0 0 .25rem;display:flex;gap:.75rem;align-items:baseline}
h2.sec .num{font-family:var(--mono);color:var(--accent);font-size:1.1rem}
.ayuda{color:var(--muted);font-size:1rem;margin:0 0 1.25rem}
.datos{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(14rem,100%),1fr));margin:0;border-top:1px solid var(--line)}
.datos div{padding:.75rem 0;border-bottom:1px solid var(--line);min-width:0}
.datos dt{color:var(--muted);font-size:.95rem}.datos dd{margin:0;font-weight:700}
.mono{font-family:var(--mono)}
.tarjetas{list-style:none;margin:0;padding:0;display:grid;gap:1rem}
.tarjetas>li{border:1px solid var(--line);border-radius:4px;padding:1rem 1.25rem;max-width:none}
.tarjetas p{margin:0}
.codigo{font-family:var(--mono);font-weight:700;color:var(--accent);margin-right:.75rem}
.etiqueta{font-size:.95rem;color:var(--muted)}
.vacio{border:2px dashed var(--line);border-radius:4px;padding:1rem 1.25rem;color:var(--muted)}.vacio p{margin:0}
.unidad{border-top:2px solid var(--fg);margin-top:2.5rem}
.semana h4{margin:0 0 .5rem}.semana h4 .sem{font-family:var(--mono);color:var(--accent);margin-right:.6rem}
.semana dl{margin:0;display:grid;gap:.75rem}.semana dt{font-weight:700;color:var(--muted);font-size:.95rem}.semana dd{margin:0}
.semana ul{margin:.2rem 0 0;padding-left:1.25rem}
.tarjetas>li.examen{border:2px solid var(--accent)}
.tabla{overflow-x:auto;border:1px solid var(--line);border-radius:4px}
table{border-collapse:collapse;width:100%;min-width:34rem;font-size:1rem}
caption{text-align:left;font-weight:700;padding:.75rem 1rem}
th,td{text-align:left;vertical-align:top;padding:.75rem 1rem;border-top:1px solid var(--line)}
td.num{text-align:right;white-space:nowrap}
.formula{font-family:var(--mono);font-size:1.1rem;padding:1rem 1.25rem;border:1px solid var(--line);border-radius:4px;margin:1.25rem 0 .75rem}
.glosario{margin:0;display:grid;gap:1rem}.glosario dd{margin:.2rem 0 0}
.firmas{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(14rem,100%),1fr));gap:1rem;margin:0}
.firmas div{border-top:1px solid var(--line);padding-top:.6rem}.firmas dt{color:var(--muted);font-size:.95rem}.firmas dd{margin:0;font-weight:700}
@media print{@page{size:A4;margin:18mm 16mm}body{background:#fff;color:#000;padding:0;font-size:11.5pt}
.saltar,.indice{display:none}.hoja{border:0;padding:0;max-width:none}.tarjetas>li,tr{break-inside:avoid}h2,h3,h4{break-after:avoid}a{color:#000}}
`;

export function construirHtmlSyllabusInclusivo(d: DatosSyllabusInclusivo): string {
  const c = d.curso;
  const nombre = escaparHtml(normalizarEspacios(c.name));

  // ---------- 1. Informacion general
  const dato = (etq: string, val: string | number | null | undefined, mono = false) =>
    val === null || val === undefined || val === ''
      ? ''
      : `<div><dt>${etq}</dt><dd${mono ? ' class="mono"' : ''}>${escaparHtml(String(val))}</dd></div>`;
  const horas = `${c.theoryHours ?? 0} de teoría, ${c.practiceHours ?? 0} de práctica, ${c.labHours ?? 0} de laboratorio`;
  const info = `<dl class="datos">
    ${dato('Asignatura', normalizarEspacios(c.name))}
    ${dato('Código', c.code, true)}
    ${dato('Tipo', c.type)}
    ${dato('Área de estudios', c.area)}
    ${dato('Créditos', c.credits, true)}
    ${dato('Semanas', c.weeks, true)}
    ${dato('Horas por semana', horas)}
    ${dato('Semestre', c.semester, true)}
    ${dato('Ciclo', c.cycle, true)}
    ${dato('Modalidad', c.modality)}
    ${dato('Requisitos', d.prerequisitos.length ? d.prerequisitos.join(', ') : 'Ninguno')}
    ${dato('Coordinador', d.coordinador)}
    ${dato(d.docentes.length > 1 ? 'Docentes' : 'Docente', d.docentes.join(', '))}
  </dl>`;

  // ---------- 2. Sumilla
  const sumilla = normalizarEspacios(c.sumilla)
    ? `${ayuda('sumilla')}<p>${texto(c.sumilla)}</p>`
    : `${ayuda('sumilla')}<div class="vacio" role="note"><p>La sumilla todavía no fue registrada.</p></div>`;

  // ---------- 3. Competencias
  const competencias = d.competencias.length
    ? `${ayuda('competencia')}<ul class="tarjetas">${d.competencias
        .map(
          (k) => `<li><p><span class="codigo">${escaparHtml(k.codigo)}</span><span class="etiqueta">${escaparHtml(
            [k.tipo, k.nivel && `nivel ${k.nivel.toLowerCase()}`].filter(Boolean).join(' · '),
          )}</span></p><p>${texto(k.descripcion)}</p></li>`,
        )
        .join('')}</ul>`
    : `${ayuda('competencia')}<div class="vacio" role="note"><p>Las competencias todavía no fueron registradas.</p></div>`;

  // ---------- 4. Logros
  const logros = d.logros.length
    ? `${ayuda('logro')}<ul class="tarjetas">${d.logros
        .map((l) => `<li><p><span class="codigo">${escaparHtml(l.codigo)}</span></p><p>${texto(l.descripcion)}</p></li>`)
        .join('')}</ul>`
    : `${ayuda('logro')}<div class="vacio" role="note"><p>El coordinador todavía no registró los logros de este curso.</p></div>`;

  // ---------- 5. Capacidades
  const capacidades = d.capacidades.length
    ? `${ayuda('capacidad')}<ol>${d.capacidades
        .map((k) => `<li><strong>${escaparHtml(normalizarEspacios(k.nombre))}.</strong> ${texto(k.descripcion)}</li>`)
        .join('')}</ol>`
    : `${ayuda('capacidad')}<div class="vacio" role="note"><p>Las capacidades todavía no fueron registradas.</p></div>`;

  // ---------- 6. Programacion (semanas iguales y seguidas se agrupan)
  const unidades = d.capacidades
    .map((k) => {
      const filas = d.programacion.filter((p) => p.capacidadId === k.id);
      if (!filas.length) return '';
      const bloques = agruparSemanas(filas);
      const desde = Math.min(...filas.map((f) => numeroSemana(f.semana)));
      const hasta = Math.max(...filas.map((f) => numeroSemana(f.semana)));
      const semanas = bloques
        .map((b) => {
          const f = b.fila;
          const titulo = texto(f.logroUnidad) || 'Plan de la semana';
          const esExamen = /^examen/i.test(normalizarEspacios(f.contenido));
          if (esExamen) {
            return `<li class="semana examen"><h4><span class="sem">${etiquetaSemanas(b.desde, b.hasta)}</span>${texto(f.contenido)}</h4></li>`;
          }
          return `<li class="semana"><h4><span class="sem">${etiquetaSemanas(b.desde, b.hasta)}</span>${titulo}</h4><dl>
            <div><dt>Contenidos</dt><dd>${grupos(aGrupos(f.contenido))}</dd></div>
            <div><dt>Actividades</dt><dd>${grupos(aGrupos(f.actividades))}</dd></div>
            <div><dt>Recursos</dt><dd>${grupos(aGrupos(f.recursos))}</dd></div>
            <div><dt>Estrategias</dt><dd>${grupos(aGrupos(f.estrategias))}</dd></div>
          </dl></li>`;
        })
        .join('');
      return `<div class="unidad"><h3>${escaparHtml(normalizarEspacios(k.nombre))}: ${texto(k.descripcion)}</h3>
        <p>${etiquetaSemanas(desde, hasta)}.</p><ol class="tarjetas">${semanas}</ol></div>`;
    })
    .join('');
  const programacion = unidades
    ? `${ayuda('programacion')}<p class="ayuda">Cuando varias semanas seguidas tienen el mismo plan, se muestran juntas.</p>${unidades}`
    : `${ayuda('programacion')}<div class="vacio" role="note"><p>La programación todavía no fue registrada.</p></div>`;

  // ---------- 7 y 8. Estrategia y recursos (un parrafo por linea del texto original)
  const parrafos = (lista: string[]) =>
    lista
      .flatMap((t) => t.split(/\r?\n/))
      .map((l) => normalizarEspacios(l))
      .filter(Boolean)
      .map((l) => `<p>${texto(l)}</p>`)
      .join('');
  const estrategia = `${ayuda('estrategia')}${parrafos(d.estrategia) || '<div class="vacio" role="note"><p>No registrada.</p></div>'}`;
  const recursos = `${ayuda('recursos')}${parrafos(d.recursos) || '<div class="vacio" role="note"><p>No registrados.</p></div>'}`;

  // ---------- 9. Evaluacion: tabla con encabezados + formula tambien en palabras
  const conPeso = d.matriz.filter((m) => m.peso);
  const total = conPeso.reduce((s, m) => s + (m.peso ?? 0), 0);
  const formula = conPeso.length
    ? `<p class="formula" aria-hidden="true">Nota final = ${conPeso
        .map((m) => `${(m.peso! / 100).toFixed(2).replace('.', ',')} × ${escaparHtml(m.nota)}`)
        .join(' + ')}</p>
      <p>La nota final suma ${conPeso
        .map((m, i) => `${i === conPeso.length - 1 && i > 0 ? 'y ' : ''}el ${m.peso} % de la nota ${escaparHtml(m.nota)} (${escaparHtml(normalizarEspacios(m.producto).toLowerCase())})`)
        .join(', ')}.</p>`
    : '';
  const evaluacion = d.matriz.length
    ? `${ayuda('evaluacion')}<div class="tabla" role="region" aria-labelledby="cap-eval" tabindex="0"><table>
        <caption id="cap-eval">Matriz de evaluación por unidad</caption>
        <thead><tr><th scope="col">Unidad</th><th scope="col">Qué se evalúa</th><th scope="col">Producto</th><th scope="col">Instrumento</th><th scope="col">Peso</th></tr></thead>
        <tbody>${d.matriz
          .map(
            (m) => `<tr><th scope="row">${escaparHtml(m.unidad)} (${escaparHtml(m.nota)})</th><td>${texto(
              m.criterio.replace(/^\s*-\s*/, ''),
            )}</td><td>${texto(m.producto)}</td><td>${texto(m.instrumento)}</td><td class="num">${m.peso ?? '—'} %</td></tr>`,
          )
          .join('')}</tbody>
        <tfoot><tr><th scope="row" colspan="4">Total</th><td class="num">${total} %</td></tr></tfoot>
      </table></div>${formula}`
    : `${ayuda('evaluacion')}<div class="vacio" role="note"><p>La evaluación todavía no fue registrada.</p></div>`;

  // ---------- 10. Bibliografia por categoria (sin repetidos exactos)
  const biblio = sinDuplicados(d.bibliografia, (b) => b.texto);
  const bibliografia = biblio.length
    ? `${ayuda('bibliografia')}${Object.keys(CATEGORIAS)
        .map((cat) => {
          const items = biblio.filter((b) => b.categoria === cat);
          return items.length
            ? `<h3>${CATEGORIAS[cat]}</h3><ol>${items.map((b) => `<li>${texto(b.texto)}</li>`).join('')}</ol>`
            : '';
        })
        .join('')}`
    : `${ayuda('bibliografia')}<div class="vacio" role="note"><p>La bibliografía todavía no fue registrada.</p></div>`;

  // ---------- Glosario: terminos del syllabus + siglas que aparecen
  const terminos = TERMINOS.filter((t) => !['borrador', 'revision', 'publicado'].includes(t.id));
  const siglas = siglasUsadas(d);
  const glosario = `<p class="ayuda">Palabras y siglas de este syllabus que pueden ser poco conocidas.</p><dl class="glosario">
    ${terminos.map((t) => `<div><dt><dfn>${escaparHtml(t.termino)}</dfn></dt><dd>${escaparHtml(t.definicion)}</dd></div>`).join('')}
    ${siglas.map((s) => `<div><dt><abbr>${s}</abbr></dt><dd>${escaparHtml(SIGLAS_SYLLABUS[s])}.</dd></div>`).join('')}
    ${['pdf'].map((id) => SIGLAS.find((x) => x.id === id)!).map((s) => `<div><dt><abbr>${s.termino}</abbr></dt><dd>${escaparHtml(s.definicion)}</dd></div>`).join('')}
  </dl>`;

  // Escudo de San Marcos (WCAG 2.1 - 1.1.1: texto alternativo). Solo se acepta una imagen PNG/JPEG en base64.
  const escudo =
    d.logoUnmsm && /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(d.logoUnmsm)
      ? `<img src="${d.logoUnmsm}" alt="Escudo de la Universidad Nacional Mayor de San Marcos" width="72" height="72">`
      : '';

  const resumen = resumenSencillo(d);
  const fecha = new Date(d.generadoEn).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  const secciones: [string, string, string, string][] = [
    ['1', 's1', 'Información general', info],
    ['2', 's2', 'Sumilla', sumilla],
    ['3', 's3', 'Competencias del perfil de egreso', competencias],
    ['4', 's4', 'Logros de aprendizaje', logros],
    ['5', 's5', 'Capacidades', capacidades],
    ['6', 's6', 'Programación por semanas', programacion],
    ['7', 's7', 'Estrategia didáctica', estrategia],
    ['8', 's8', 'Recursos y materiales', recursos],
    ['9', 's9', 'Evaluación', evaluacion],
    ['10', 's10', 'Bibliografía', bibliografia],
    ['G', 'glosario', 'Glosario y siglas', glosario],
  ];

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sílabo de ${nombre} · Inkluye</title>
<meta name="description" content="Sílabo accesible (WCAG 2.1 AAA) del curso ${nombre}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&family=Atkinson+Hyperlegible+Mono:wght@400;700&display=swap">
<style>${ESTILOS}</style>
</head>
<body>
<a class="saltar" href="#contenido">Saltar al contenido del sílabo</a>
<main id="contenido" class="hoja" tabindex="-1">
  <header class="membrete">
    ${escudo}
    <div class="textos">
      <p class="universidad">Universidad Nacional Mayor de San Marcos</p>
      <p>Facultad de Ingeniería de Sistemas e Informática</p>
    </div>
  </header>
  <h1><span class="tipo">Sílabo</span>${nombre}</h1>
  <p class="subtitulo">Código <span class="mono">${escaparHtml(c.code)}</span>${c.semester ? ` · Semestre <span class="mono">${escaparHtml(c.semester)}</span>` : ''}${c.cycle ? ` · Ciclo ${escaparHtml(c.cycle)}` : ''}</p>
  ${resumen.length ? `<section class="sencillo" aria-labelledby="sencillo-t"><h2 id="sencillo-t">El curso en pocas palabras</h2><ul>${resumen.map((l) => `<li>${escaparHtml(l)}</li>`).join('')}</ul></section>` : ''}
  <nav class="indice" aria-labelledby="indice-t"><h2 id="indice-t">Contenido del sílabo</h2><ol>
    ${secciones.map(([, id, titulo]) => `<li><a href="#${id}">${escaparHtml(titulo)}</a></li>`).join('')}
  </ol></nav>
  ${secciones.map(([num, id, titulo, cuerpo]) => seccion(num, id, titulo, cuerpo)).join('\n')}
  <footer>
    <h2 class="sec">Responsables</h2>
    <dl class="firmas">
      ${d.coordinador ? `<div><dt>Coordinador del curso</dt><dd>${escaparHtml(d.coordinador)}</dd></div>` : ''}
      ${d.docentes.length ? `<div><dt>${d.docentes.length > 1 ? 'Docentes' : 'Docente'}</dt><dd>${escaparHtml(d.docentes.join(', '))}</dd></div>` : ''}
      <div><dt>Generado por</dt><dd>Sistema Inkluye, el ${escaparHtml(fecha)}</dd></div>
    </dl>
    <p class="ayuda">Documento accesible según las pautas <abbr title="Pautas de Accesibilidad para el Contenido Web">WCAG</abbr> 2.1, nivel <abbr title="Nivel más alto de cumplimiento">AAA</abbr>.</p>
  </footer>
</main>
</body>
</html>`;
}
