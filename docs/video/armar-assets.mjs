// Copia las capturas que usa el video a assets/ y calcula cuánto debe panear cada
// captura de página completa dentro del marco del teléfono (assets/pan.js).
//
// Uso: node armar-assets.mjs   (desde docs/video, después de regenerar las capturas)

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const AQUI = resolve(import.meta.dirname);
const CAPTURAS = resolve(AQUI, '..', 'capturas');
const ASSETS = join(AQUI, 'assets');
mkdirSync(join(ASSETS, 'movil'), { recursive: true });

const MOVIL = ['02-perdidas-lista', '03-perdidas-mapa', '05-perdidas-avistamiento', '08-adopcion-lista',
  '10-veterinarias-lista', '12-identificacion-lista', '14-ficha-publica', '15-denuncias-lista',
  '17-denuncias-seguimiento', '19-casos-lista'];
const ESCRITORIO = ['22-admin-estadisticas'];

for (const n of MOVIL) copyFileSync(join(CAPTURAS, 'movil', `${n}.png`), join(ASSETS, 'movil', `${n}.png`));
for (const n of ESCRITORIO) copyFileSync(join(CAPTURAS, `${n}.png`), join(ASSETS, `${n}.png`));

// Alto de un PNG: bytes 20-24 de la cabecera IHDR.
function altoPng(ruta) {
  const b = readFileSync(ruta);
  return b.readUInt32BE(20);
}
function anchoPng(ruta) {
  const b = readFileSync(ruta);
  return b.readUInt32BE(16);
}

// La captura se muestra a 370 px de ancho dentro de un marco de 824 px de alto útil.
const ANCHO_MOSTRADO = 370;
const ALTO_MARCO = 824;
const PAN_MAXIMO = 1500;

function pan(nombre) {
  const ruta = join(ASSETS, 'movil', `${nombre}.png`);
  const escala = ANCHO_MOSTRADO / anchoPng(ruta);
  const altoMostrado = altoPng(ruta) * escala;
  return Math.max(0, Math.min(PAN_MAXIMO, Math.round(altoMostrado - ALTO_MARCO)));
}

const PAN = {
  e1: pan('02-perdidas-lista'),
  e3: pan('08-adopcion-lista'),
  e4: pan('10-veterinarias-lista'),
  e5: pan('12-identificacion-lista'),
  e6: pan('15-denuncias-lista'),
  e7: pan('19-casos-lista'),
};

writeFileSync(join(ASSETS, 'pan.js'), `// Generado por armar-assets.mjs\nwindow.PAN = ${JSON.stringify(PAN, null, 2)};\n`);
console.log('Assets copiados. Paneos:', PAN);
