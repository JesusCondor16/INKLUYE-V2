// lib/pdfAccesible.ts
// Convierte el HTML accesible del syllabus en un PDF ETIQUETADO (Tagged PDF / PDF/UA).
// Un PDF etiquetado guarda la estructura (titulos, listas, tablas, idioma, orden de lectura),
// que es lo que leen los lectores de pantalla. jsPDF no puede generarlo; Chromium si.
import puppeteer from 'puppeteer';

const TIEMPO_MAXIMO_MS = 30_000;

export async function htmlAPdfEtiquetado(html: string): Promise<Buffer> {
  const navegador = await puppeteer.launch({ headless: true });
  try {
    const pagina = await navegador.newPage();
    // El HTML es nuestro y no tiene scripts: se desactiva JavaScript por seguridad
    await pagina.setJavaScriptEnabled(false);
    // 'load' espera la hoja de estilos de las fuentes; si no hay internet, se usan las de respaldo
    await pagina.setContent(html, { waitUntil: 'load', timeout: TIEMPO_MAXIMO_MS });
    await pagina.emulateMediaType('print');

    const pdf = await pagina.pdf({
      format: 'A4',
      printBackground: true,
      tagged: true, // estructura accesible (etiquetas) dentro del PDF
      outline: true, // marcadores a partir de los titulos: navegar el PDF por secciones
      preferCSSPageSize: true,
      timeout: TIEMPO_MAXIMO_MS,
    });
    return Buffer.from(pdf);
  } finally {
    await navegador.close();
  }
}
