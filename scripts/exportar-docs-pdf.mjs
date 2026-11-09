// Exporta la documentación académica (docs/*.md) a PDF.
//
// Cada Markdown se convierte a HTML con `marked`, se envuelve en una plantilla
// imprimible que carga Mermaid desde CDN para dibujar los diagramas, y se
// imprime con Chrome o Edge en modo sin ventana. No hace falta instalar nada
// más que el navegador, que ya está en cualquier máquina del equipo.
//
// Uso: npm run docs:pdf                → exporta todos los docs/NN-*.md
//      npm run docs:pdf -- 03          → exporta solo los que empiezan con "03"
//      npm run docs:pdf -- 03 --html   → además conserva el HTML intermedio en
//                                        docs/pdf/.html/ para revisarlo en el navegador

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';

const RAIZ = resolve(import.meta.dirname, '..');
const CARPETA_DOCS = join(RAIZ, 'docs');
const CARPETA_PDF = join(CARPETA_DOCS, 'pdf');
const CARPETA_TMP = join(CARPETA_PDF, '.html');

const CANDIDATOS_NAVEGADOR = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const navegador = CANDIDATOS_NAVEGADOR.find((ruta) => existsSync(ruta));
if (!navegador) {
  console.error(
    'No se encontró Chrome ni Edge. Instalá uno o indicá la ruta con la variable CHROME_PATH.',
  );
  process.exit(1);
}

const argumentos = process.argv.slice(2);
const conservarHtml = argumentos.includes('--html');
const filtro = argumentos.find((arg) => !arg.startsWith('--')) ?? '';
const archivos = readdirSync(CARPETA_DOCS)
  .filter((nombre) => /^\d{2}-.*\.md$/.test(nombre) && nombre.startsWith(filtro))
  .sort();

if (archivos.length === 0) {
  console.error(`No hay documentos en docs/ que coincidan con "${filtro}".`);
  process.exit(1);
}

mkdirSync(CARPETA_TMP, { recursive: true });

// Los bloques ```mermaid se convierten en <pre class="mermaid"> para que la
// librería los dibuje al cargar la página.
// Los métodos se definen con `function` y delegan en el prototipo con `this`: marked
// arma su propio renderer combinado y solo ese tiene el `parser` que las imágenes usan.
const renderer = new marked.Renderer();
renderer.code = function (token) {
  if (token.lang === 'mermaid') {
    return `<pre class="mermaid">${escaparHtml(token.text)}</pre>`;
  }
  return marked.Renderer.prototype.code.call(this, token);
};
// Las imágenes se referencian relativas a docs/ (por ejemplo capturas/01-inicio.png);
// como el HTML intermedio vive en docs/pdf/.html/, se convierten a rutas absolutas.
renderer.image = function (token) {
  if (!/^(https?:|data:|file:)/.test(token.href)) {
    token = { ...token, href: pathToFileURL(join(CARPETA_DOCS, token.href)).href };
  }
  return marked.Renderer.prototype.image.call(this, token);
};
marked.use({ renderer, gfm: true });

for (const archivo of archivos) {
  const markdown = readFileSync(join(CARPETA_DOCS, archivo), 'utf8');
  const cuerpo = marked.parse(markdown);
  const titulo = (markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(archivo, '.md')).trim();

  const nombreBase = basename(archivo, '.md');
  const rutaHtml = join(CARPETA_TMP, `${nombreBase}.html`);
  const rutaPdf = join(CARPETA_PDF, `${nombreBase}.pdf`);

  writeFileSync(rutaHtml, plantilla(titulo, cuerpo), 'utf8');

  execFileSync(navegador, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    // Da tiempo a que Mermaid termine de dibujar antes de imprimir.
    '--virtual-time-budget=15000',
    '--no-pdf-header-footer',
    `--print-to-pdf=${rutaPdf}`,
    pathToFileURL(rutaHtml).href,
  ], { stdio: 'ignore' });

  console.log(`✓ ${nombreBase}.pdf`);
}

if (!conservarHtml) {
  rmSync(CARPETA_TMP, { recursive: true, force: true });
}
console.log(`\nListo: ${archivos.length} PDF en docs/pdf/`);

function escaparHtml(texto) {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function plantilla(titulo, cuerpo) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${escaparHtml(titulo)}</title>
<style>
  @page { size: A4; margin: 20mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1f2937;
    margin: 0;
  }
  h1 { font-size: 22pt; color: #4c1d95; border-bottom: 3px solid #7c3aed; padding-bottom: 6px; margin-top: 0; }
  h2 { font-size: 15pt; color: #4c1d95; margin-top: 22pt; page-break-after: avoid; }
  h3 { font-size: 12pt; color: #5b21b6; margin-top: 18pt; page-break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { color: #6d28d9; text-decoration: none; }
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 9pt;
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
  }
  pre { background: #f3f4f6; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 9pt; }
  pre code { background: none; padding: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 10pt 0;
    font-size: 9pt;
    page-break-inside: auto;
  }
  tr { page-break-inside: avoid; }
  th, td { border: 1px solid #d1d5db; padding: 5px 7px; vertical-align: top; text-align: left; }
  th { background: #ede9fe; color: #3b0764; }
  tbody tr:nth-child(even) { background: #fafafa; }
  blockquote { border-left: 3px solid #a78bfa; margin: 10pt 0; padding: 4pt 12pt; color: #4b5563; background: #f5f3ff; }
  hr { border: none; border-top: 1px solid #e5e7eb; margin: 16pt 0; }
  /* Capturas del manual: acotadas en alto para que el texto fluya alrededor de ellas. */
  p:has(> img:only-child) { text-align: center; page-break-inside: avoid; margin: 8pt 0 12pt; }
  img { max-width: 100%; max-height: 105mm; height: auto; border: 1px solid #e5e7eb; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  pre.mermaid {
    background: none;
    padding: 0;
    text-align: center;
    page-break-inside: avoid;
  }
  /* El diagrama se achica proporcionalmente para no partirse entre páginas. */
  pre.mermaid svg { width: auto; height: auto; max-width: 100%; max-height: 235mm; }
  /* Un <div class="apaisada"> en el Markdown imprime su contenido en hoja horizontal:
     sirve para diagramas anchos (secuencia, entidad-relación). */
  @page apaisada { size: A4 landscape; margin: 15mm 18mm; }
  .apaisada { page: apaisada; }
  .apaisada pre.mermaid svg { max-height: 175mm; }
</style>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: true,
    theme: 'neutral',
    securityLevel: 'loose',
    // Los mensajes largos se parten en varias líneas: sin esto un diagrama de
    // secuencia con siete participantes sale de 2600 px de ancho e ilegible.
    sequence: { wrap: true, width: 150, messageMargin: 30, actorMargin: 40 },
  });
</script>
</head>
<body>
${cuerpo}
</body>
</html>`;
}
