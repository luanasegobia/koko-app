// Convierte el archivo .env.local en un módulo TypeScript que Angular pueda importar.
//
// Angular no lee archivos .env: la configuración se compila dentro del bundle. Para
// que el equipo siga usando el mismo .env.local de siempre (y para que las claves
// nunca queden versionadas), este script genera src/environments/entorno.local.ts
// antes de cada `npm run dev`, `npm run build` y `npm test`.
//
// En CI no hay .env.local: los valores salen de las variables de entorno del
// proceso, que tienen prioridad sobre el archivo.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

const CLAVES = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'STRIPE_PUBLISHABLE_KEY',
  'HABILITAR_TIEMPO_REAL',
  'HABILITAR_ALERTAS',
];

/** Lee un archivo .env sencillo (CLAVE=valor, comentarios con #). */
function leerArchivoEnv(ruta) {
  if (!existsSync(ruta)) return {};
  const valores = {};
  for (const linea of readFileSync(ruta, 'utf8').split(/\r?\n/)) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const igual = limpia.indexOf('=');
    if (igual === -1) continue;
    const clave = limpia.slice(0, igual).trim();
    let valor = limpia.slice(igual + 1).trim();
    const entreComillas =
      (valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"));
    if (entreComillas) valor = valor.slice(1, -1);
    valores[clave] = valor;
  }
  return valores;
}

const archivo = leerArchivoEnv(join(raiz, '.env.local'));
const entorno = {};
for (const clave of CLAVES) {
  // Se aceptan también los nombres viejos con prefijo VITE_, para que un
  // .env.local de la versión anterior siga funcionando sin tocarlo.
  entorno[clave] =
    process.env[clave] ??
    process.env[`VITE_${clave}`] ??
    archivo[clave] ??
    archivo[`VITE_${clave}`] ??
    '';
}

const salida = `// Archivo GENERADO por scripts/generar-entorno.mjs a partir de .env.local.
// No se edita a mano ni se versiona: se regenera en cada npm run dev / build / test.
export const ENTORNO_LOCAL = ${JSON.stringify(entorno, null, 2)};
`;

const destino = join(raiz, 'src', 'environments', 'entorno.local.ts');
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, salida);

const conValor = CLAVES.filter((clave) => entorno[clave]).length;
console.log(`Entorno generado en src/environments/entorno.local.ts (${conValor}/${CLAVES.length} variables con valor).`);
