// Genera la presentación de la defensa (docs/presentacion/Koko-Presentacion.pptx) y el
// guion con notas del presentador (docs/08-presentacion.md) desde una misma lista de
// diapositivas, así ambos quedan sincronizados.
//
// Uso: node scripts/generar-presentacion.mjs
// Requiere las capturas en docs/capturas y las imágenes en docs/presentacion/img.

import pptxgen from 'pptxgenjs';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const RAIZ = resolve(import.meta.dirname, '..');
const DOCS = join(RAIZ, 'docs');
const IMG = join(DOCS, 'presentacion', 'img');
const CAP = join(DOCS, 'capturas');
mkdirSync(join(DOCS, 'presentacion'), { recursive: true });

// Paleta: la de la aplicación (fondo oscuro, verde esmeralda).
const C = {
  fondo: '0B0F14', panel: '111827', borde: '1F2937',
  texto: 'F4F4F5', suave: 'A1A1AA', verde: '10B981', verdeClaro: '34D399',
  rojo: 'EF4444', ambar: 'F59E0B', azul: '60A5FA', rosa: 'F472B6',
};
const FUENTE = 'Calibri';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 pulgadas
pres.author = 'Equipo Koko App';
pres.title = 'Koko App · Conectando Huellas';

const guion = [];
let numero = 0;

function nueva(titulo, minutos, notas) {
  const s = pres.addSlide();
  s.background = { color: C.fondo };
  numero += 1;
  if (titulo) {
    s.addText(titulo, { x: 0.5, y: 0.3, w: 9, h: 0.7, fontFace: FUENTE, fontSize: 32, bold: true, color: C.texto, isTextBox: true, margin: 0 });
  }
  s.addText(`${numero}`, { x: 9.2, y: 5.15, w: 0.5, h: 0.3, fontFace: FUENTE, fontSize: 10, color: C.suave, align: 'right', isTextBox: true, margin: 0 });
  s.addNotes(notas);
  guion.push({ numero, titulo: titulo ?? 'Portada', minutos, notas });
  return s;
}

function tarjeta(s, x, y, w, h) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: C.panel }, line: { color: C.borde, width: 1 }, rectRadius: 0.12 });
}

function circuloIcono(s, x, y, color, letra) {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: 0.42, h: 0.42, fill: { color }, line: { color, width: 0 } });
  s.addText(letra, { x, y, w: 0.42, h: 0.42, fontFace: FUENTE, fontSize: 14, bold: true, color: C.fondo, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
}

function vinetas(s, items, x, y, w, h, tam = 15) {
  s.addText(items.map((t, i) => ({ text: t, options: { bullet: true, breakLine: i < items.length - 1, paraSpaceAfter: 6 } })),
    { x, y, w, h, fontFace: FUENTE, fontSize: tam, color: C.texto, valign: 'top', isTextBox: true, margin: 0 });
}

function imagen(s, ruta, opciones) {
  if (!existsSync(ruta)) { console.warn(`⚠ falta ${ruta}`); return; }
  s.addImage({ path: ruta, ...opciones });
}

// Un teléfono: marco redondeado con la captura adentro (las capturas móviles son 780x1688 → 390x844).
function telefono(s, ruta, x, y, h) {
  const w = h * (390 / 844);
  s.addShape(pres.ShapeType.roundRect, { x: x - 0.06, y: y - 0.06, w: w + 0.12, h: h + 0.12, fill: { color: C.borde }, line: { color: C.borde, width: 0 }, rectRadius: 0.22 });
  imagen(s, ruta, { x, y, w, h, rounding: false });
}

// ---------------------------------------------------------------------------
// 1. Portada
// ---------------------------------------------------------------------------
{
  const s = nueva(null, 1, 'Presentarse: nombres, materia y qué es Koko en una frase. "Koko es una app comunitaria para las mascotas de Orán: perdidas, adopción, veterinarias, chapa QR, denuncias y casos urgentes en un solo lugar."');
  s.addShape(pres.ShapeType.ellipse, { x: 0.7, y: 0.9, w: 1.1, h: 1.1, fill: { color: C.verde }, line: { color: C.verde, width: 0 } });
  s.addText('K', { x: 0.7, y: 0.9, w: 1.1, h: 1.1, fontFace: FUENTE, fontSize: 48, bold: true, color: C.fondo, align: 'center', valign: 'middle', isTextBox: true, margin: 0 });
  s.addText([{ text: 'Koko ', options: { color: C.texto } }, { text: 'App', options: { color: C.verdeClaro } }],
    { x: 0.7, y: 2.15, w: 6, h: 1, fontFace: FUENTE, fontSize: 60, bold: true, isTextBox: true, margin: 0 });
  s.addText('Conectando Huellas · la red solidaria para las mascotas de Orán', { x: 0.7, y: 3.1, w: 6.2, h: 0.5, fontFace: FUENTE, fontSize: 18, color: C.suave, isTextBox: true, margin: 0 });
  s.addText('Prácticas Profesionalizantes III · Proyecto final · 2026', { x: 0.7, y: 3.75, w: 6.2, h: 0.4, fontFace: FUENTE, fontSize: 14, color: C.verdeClaro, isTextBox: true, margin: 0 });
  s.addText('Integrantes: (completar)   ·   Docente: (completar)', { x: 0.7, y: 4.25, w: 6.2, h: 0.4, fontFace: FUENTE, fontSize: 13, color: C.suave, isTextBox: true, margin: 0 });
  telefono(s, join(IMG, 'movil-01-inicio.png'), 7.4, 0.55, 4.55);
}

// ---------------------------------------------------------------------------
// 2. Problema
// ---------------------------------------------------------------------------
{
  const s = nueva('El problema', 1, 'En Orán todo pasa por grupos de WhatsApp y Facebook: cuando se pierde una mascota la información se dispersa, no se puede buscar ni ubicar en un mapa, y desaparece en horas. Quien encuentra un animal sin chapa no tiene a quién llamar. No hay directorio de veterinarias de turno. Las denuncias no tienen seguimiento. Los rescatistas juntan plata por cadenas de mensajes.');
  const filas = [
    ['P', C.rojo, 'Información dispersa', 'Mascotas perdidas en decenas de publicaciones que no se buscan, no se ubican y desaparecen del feed en horas.'],
    ['V', C.azul, 'Sin directorio confiable', 'Nadie sabe qué veterinaria está de turno o atiende urgencias a la madrugada.'],
    ['D', C.ambar, 'Denuncias sin respuesta', 'El maltrato se comenta pero no se canaliza; quien denuncia no sabe qué pasó después.'],
    ['R', C.rosa, 'Rescates sin apoyo', 'Cirugías y tratamientos dependen de cadenas de mensajes que se cortan.'],
  ];
  filas.forEach(([letra, color, tit, desc], i) => {
    const y = 1.25 + i * 1.02;
    circuloIcono(s, 0.6, y + 0.05, color, letra);
    s.addText(tit, { x: 1.2, y, w: 4.5, h: 0.35, fontFace: FUENTE, fontSize: 17, bold: true, color: C.texto, isTextBox: true, margin: 0 });
    s.addText(desc, { x: 1.2, y: y + 0.36, w: 4.6, h: 0.6, fontFace: FUENTE, fontSize: 12.5, color: C.suave, isTextBox: true, margin: 0 });
  });
  tarjeta(s, 6.3, 1.25, 3.2, 3.7);
  s.addText('"La información sobre las mascotas de Orán está fragmentada en canales informales que no permiten buscar, ubicar ni hacer seguimiento."',
    { x: 6.5, y: 1.45, w: 2.8, h: 2.2, fontFace: FUENTE, fontSize: 15, italic: true, color: C.texto, isTextBox: true, margin: 0, valign: 'top' });
  s.addText('Definición del problema · Etapa 1', { x: 6.5, y: 4.3, w: 2.8, h: 0.4, fontFace: FUENTE, fontSize: 11, color: C.verdeClaro, isTextBox: true, margin: 0 });
}

// ---------------------------------------------------------------------------
// 3. Objetivos
// ---------------------------------------------------------------------------
{
  const s = nueva('Objetivos', 1, 'Objetivo general: una aplicación web, accesible desde el celular, que centralice la gestión de mascotas en Orán. Seis módulos, más comunidad (chat y alertas) y seguridad (cada uno edita solo lo suyo).');
  s.addText('Desarrollar una aplicación web, accesible desde el celular, que centralice en una sola plataforma comunitaria la gestión de mascotas en la ciudad de Orán.',
    { x: 0.5, y: 1.1, w: 9, h: 0.7, fontFace: FUENTE, fontSize: 15, color: C.suave, isTextBox: true, margin: 0 });
  const mods = [
    ['Mascotas perdidas', 'Publicar, mapa, avistamientos sin cuenta', C.rojo],
    ['Adopción', 'Catálogo con filtros y contacto directo', C.rosa],
    ['Veterinarias', 'Directorio verificado, de turno y 24 h', C.azul],
    ['Identificación QR', 'Ficha pública para la chapa de la mascota', C.verde],
    ['Denuncias', 'Con evidencia y código de seguimiento', C.ambar],
    ['Casos urgentes', 'Meta, alias para donar y necesidades', C.verdeClaro],
  ];
  mods.forEach(([t, d, color], i) => {
    const col = i % 3, fila = Math.floor(i / 3);
    const x = 0.5 + col * 3.1, y = 2.05 + fila * 1.55;
    tarjeta(s, x, y, 2.9, 1.35);
    circuloIcono(s, x + 0.2, y + 0.2, color, String(i + 1));
    s.addText(t, { x: x + 0.75, y: y + 0.18, w: 2.05, h: 0.45, fontFace: FUENTE, fontSize: 15, bold: true, color: C.texto, isTextBox: true, margin: 0, valign: 'middle' });
    s.addText(d, { x: x + 0.2, y: y + 0.72, w: 2.5, h: 0.55, fontFace: FUENTE, fontSize: 11.5, color: C.suave, isTextBox: true, margin: 0 });
  });
}

// ---------------------------------------------------------------------------
// 4. Requisitos
// ---------------------------------------------------------------------------
{
  const s = nueva('Requisitos', 1, 'Relevamos 51 requisitos funcionales, 21 no funcionales y 11 de datos. Cada requisito tiene prioridad, estado real (implementado, parcial, pendiente) y el archivo del código que lo resuelve: la documentación describe el sistema tal como está. Destacar los no funcionales de seguridad: RLS en todas las tablas y autoría asignada por el servidor.');
  const stats = [['51', 'funcionales', C.verdeClaro], ['21', 'no funcionales', C.azul], ['11', 'de datos', C.rosa], ['7', 'reglas de negocio', C.ambar]];
  stats.forEach(([n, l, color], i) => {
    const x = 0.5 + i * 2.3;
    tarjeta(s, x, 1.15, 2.1, 1.25);
    s.addText(n, { x, y: 1.2, w: 2.1, h: 0.75, fontFace: FUENTE, fontSize: 40, bold: true, color, align: 'center', isTextBox: true, margin: 0 });
    s.addText(l, { x, y: 1.9, w: 2.1, h: 0.4, fontFace: FUENTE, fontSize: 12, color: C.suave, align: 'center', isTextBox: true, margin: 0 });
  });
  s.addText('Funcionales destacados', { x: 0.5, y: 2.65, w: 4.4, h: 0.35, fontFace: FUENTE, fontSize: 15, bold: true, color: C.verdeClaro, isTextBox: true, margin: 0 });
  vinetas(s, [
    'RF-10 Reportar avistamiento sin cuenta (hasta 50 por publicación)',
    'RF-25 QR único que no cambia al editar la mascota',
    'RF-30 Código de seguimiento generado en la base',
    'RF-22 Verificación de veterinarias por administración',
    'RF-44 Notificación al dueño por cada respuesta en el chat',
  ], 0.5, 3.05, 4.4, 2, 12.5);
  s.addText('No funcionales', { x: 5.2, y: 2.65, w: 4.3, h: 0.35, fontFace: FUENTE, fontSize: 15, bold: true, color: C.azul, isTextBox: true, margin: 0 });
  vinetas(s, [
    'Seguridad: RLS en las 10 tablas; la autoría la pone el servidor',
    'Privacidad: QR generado en el dispositivo; recuperación sin enumerar cuentas',
    'Usabilidad: mobile first, español, modo claro y oscuro',
    'Mantenibilidad: migraciones versionadas, lint, tests y PR obligatorio',
    'Robustez: GPS o cámara denegados no bloquean nada',
  ], 5.2, 3.05, 4.3, 2, 12.5);
}

// ---------------------------------------------------------------------------
// 5. Casos de uso
// ---------------------------------------------------------------------------
{
  const s = nueva('Casos de uso', 1, 'Seis actores: visitante, usuario registrado, veterinario, administrador, más Supabase y Stripe como sistemas externos. 25 casos de uso; mostramos los dos principales: publicar mascota perdida (CU-05) y reportar avistamiento sin cuenta (CU-07). El visitante puede hacer mucho sin registrarse: es una decisión de diseño para bajar la barrera de entrada.');
  imagen(s, join(IMG, 'casos-de-uso.png'), { x: 0.4, y: 1.05, w: 5.3, h: 4.25, sizing: { type: 'contain', w: 5.3, h: 4.25 } });
  tarjeta(s, 6.0, 1.1, 3.6, 1.95);
  s.addText('CU-05 · Publicar mascota perdida', { x: 6.2, y: 1.2, w: 3.3, h: 0.35, fontFace: FUENTE, fontSize: 14, bold: true, color: C.verdeClaro, isTextBox: true, margin: 0 });
  vinetas(s, ['Actor: usuario registrado', 'Foto con la cámara, GPS opcional', 'Alternativas: sin sesión → login; sin GPS → dirección a mano'], 6.2, 1.6, 3.3, 1.4, 11.5);
  tarjeta(s, 6.0, 3.25, 3.6, 1.95);
  s.addText('CU-07 · Reportar avistamiento', { x: 6.2, y: 3.35, w: 3.3, h: 0.35, fontFace: FUENTE, fontSize: 14, bold: true, color: C.ambar, isTextBox: true, margin: 0 });
  vinetas(s, ['Actor: visitante, sin cuenta', 'Validado en el servidor: 200 caracteres, coordenadas, tope de 50', 'Aparece en el mapa y notifica al dueño'], 6.2, 3.75, 3.3, 1.4, 11.5);
}

// ---------------------------------------------------------------------------
// 6. Diagramas UML
// ---------------------------------------------------------------------------
{
  const s = nueva('Diagramas UML', 2, 'Clases del dominio (izquierda): Perfil publica MascotaPerdida, AnimalAdopcion y registra MascotaIdentificada; los avistamientos son una composición dentro de la publicación. Secuencia (derecha): "La vi" llama a una función SECURITY DEFINER en la base, porque la política de la tabla solo deja actualizar al dueño; la función valida y agrega el avistamiento. Mencionar que hay 13 diagramas en total: componentes, 3 de clases, 4 de secuencia, 3 de flujo y 2 de estados.');
  s.addText('Clases: perfil y mascotas', { x: 0.5, y: 1.0, w: 4.4, h: 0.3, fontFace: FUENTE, fontSize: 13, bold: true, color: C.verdeClaro, isTextBox: true, margin: 0 });
  imagen(s, join(IMG, 'clases.png'), { x: 0.5, y: 1.35, w: 4.4, h: 3.9, sizing: { type: 'contain', w: 4.4, h: 3.9 } });
  s.addText('Secuencia: reportar avistamiento sin cuenta', { x: 5.2, y: 1.0, w: 4.4, h: 0.3, fontFace: FUENTE, fontSize: 13, bold: true, color: C.ambar, isTextBox: true, margin: 0 });
  imagen(s, join(IMG, 'secuencia.png'), { x: 5.2, y: 1.35, w: 4.4, h: 3.9, sizing: { type: 'contain', w: 4.4, h: 3.9 } });
}

// ---------------------------------------------------------------------------
// 7. Base de datos
// ---------------------------------------------------------------------------
{
  const s = nueva('Diseño de base de datos', 1, 'PostgreSQL en Supabase, 10 tablas con UUID. Decisiones: listas cortas como JSONB (avistamientos, necesidades, horarios) porque siempre se leen con su publicación y tienen tope; estados como texto con CHECK; seguridad a nivel de fila en todas las tablas, con la autoría asignada por DEFAULT auth.uid(). Siete funciones y triggers hacen lo que necesita privilegios: alta de perfil, avistamientos, código de seguimiento, notificación de chat.');
  imagen(s, join(IMG, 'der.png'), { x: 0.4, y: 1.05, w: 5.4, h: 4.2, sizing: { type: 'contain', w: 5.4, h: 4.2 } });
  const datos = [['10', 'tablas'], ['20', 'índices'], ['7', 'funciones y triggers'], ['40+', 'políticas RLS']];
  datos.forEach(([n, l], i) => {
    const x = 6.1 + (i % 2) * 1.8, y = 1.1 + Math.floor(i / 2) * 1.05;
    tarjeta(s, x, y, 1.65, 0.9);
    s.addText(n, { x, y: y + 0.05, w: 1.65, h: 0.5, fontFace: FUENTE, fontSize: 26, bold: true, color: C.verdeClaro, align: 'center', isTextBox: true, margin: 0 });
    s.addText(l, { x, y: y + 0.55, w: 1.65, h: 0.3, fontFace: FUENTE, fontSize: 10.5, color: C.suave, align: 'center', isTextBox: true, margin: 0 });
  });
  vinetas(s, [
    'RLS en todas las tablas: lectura pública, escritura del dueño o admin',
    'Autoría por DEFAULT auth.uid(): nadie publica a nombre de otro',
    'es_admin no se puede escribir desde la app (permisos por columna + trigger)',
    'Avistamientos y códigos de seguimiento se generan en la base',
  ], 6.1, 3.35, 3.5, 1.9, 11.5);
}

// ---------------------------------------------------------------------------
// 8. Tecnologías
// ---------------------------------------------------------------------------
{
  const s = nueva('Tecnologías', 1, 'Frontend: React 18 con Vite, Tailwind y shadcn/ui, React Router, TanStack Query, react-hook-form con Zod, Leaflet para mapas, qrcode para el QR generado en el dispositivo. Backend: Supabase (PostgreSQL 17, Auth, Storage, Edge Functions). Calidad: ESLint, Vitest, GitHub con ramas y Pull Requests. Sin servidor propio: la app usa la clave pública y la seguridad vive en la base.');
  const grupos = [
    ['Frontend', C.verdeClaro, ['React 18 + Vite', 'Tailwind CSS + shadcn/ui', 'React Router · TanStack Query', 'react-hook-form + Zod', 'Leaflet + OpenStreetMap', 'qrcode (QR en el dispositivo)']],
    ['Backend', C.azul, ['Supabase (nube)', 'PostgreSQL 17 + RLS', 'Auth: email + código, recuperación', 'Storage: bucket public-files', 'Edge Function (Stripe, deshabilitado)']],
    ['Calidad y equipo', C.ambar, ['ESLint + Vitest (jsdom)', 'Migraciones versionadas', 'GitHub: ramas + Pull Request', 'PWA instalable', 'Documentación en Markdown + PDF']],
  ];
  grupos.forEach(([t, color, items], i) => {
    const x = 0.5 + i * 3.1;
    tarjeta(s, x, 1.15, 2.9, 4.05);
    s.addText(t, { x: x + 0.25, y: 1.3, w: 2.5, h: 0.4, fontFace: FUENTE, fontSize: 17, bold: true, color, isTextBox: true, margin: 0 });
    vinetas(s, items, x + 0.25, 1.85, 2.5, 3.2, 12.5);
  });
}

// ---------------------------------------------------------------------------
// 9. Metodología RUP
// ---------------------------------------------------------------------------
{
  const s = nueva('Metodología: RUP', 1, 'Cuatro fases con fechas reales del repositorio. Inicio en junio: migrar el prototipo de Base44 a Supabase. Elaboración hasta el 3 de agosto: requisitos, esquema, seguridad RLS, tests y flujo de trabajo. Construcción hasta el 21 de agosto: capa de datos, autoría, avistamientos en el mapa, PWA. Transición: documentación, corrección de brechas, pruebas de aceptación, publicación y esta defensa. Ocho semanas efectivas.');
  const fases = [
    ['Inicio', '20 – 26 jun', 'Relevamiento, repositorio, migración a Supabase', C.verdeClaro],
    ['Elaboración', '27 jun – 3 ago', 'Requisitos, esquema, RLS, Zod, tests, flujo de PR', C.azul],
    ['Construcción', '4 – 21 ago', 'Capa de datos, autoría, avistamientos, PWA', C.ambar],
    ['Transición', 'sep – entrega', 'Documentación, brechas, pruebas, publicación', C.rosa],
  ];
  fases.forEach(([t, f, d, color], i) => {
    const x = 0.5 + i * 2.3;
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.85, y: 1.2, w: 0.4, h: 0.4, fill: { color }, line: { color, width: 0 } });
    if (i < 3) s.addShape(pres.ShapeType.line, { x: x + 1.3, y: 1.4, w: 1.85, h: 0, line: { color: C.borde, width: 2 } });
    tarjeta(s, x, 1.85, 2.1, 2.2);
    s.addText(t, { x: x + 0.2, y: 1.95, w: 1.8, h: 0.4, fontFace: FUENTE, fontSize: 16, bold: true, color, isTextBox: true, margin: 0 });
    s.addText(f, { x: x + 0.2, y: 2.35, w: 1.8, h: 0.3, fontFace: FUENTE, fontSize: 11, color: C.suave, isTextBox: true, margin: 0 });
    s.addText(d, { x: x + 0.2, y: 2.75, w: 1.75, h: 1.2, fontFace: FUENTE, fontSize: 11.5, color: C.texto, isTextBox: true, margin: 0 });
  });
  s.addText('Esfuerzo total: 8 semanas efectivas (Inicio 1 · Elaboración 2,5 · Construcción 2,5 · Transición 2). Riesgo principal cubierto: video de respaldo si falla la conexión en la demo.',
    { x: 0.5, y: 4.35, w: 9, h: 0.8, fontFace: FUENTE, fontSize: 12.5, color: C.suave, isTextBox: true, margin: 0 });
}

// ---------------------------------------------------------------------------
// 10. Demo en vivo
// ---------------------------------------------------------------------------
{
  const s = nueva('Demo en vivo', 4, 'Guion de la demo (4 minutos), desde el celular con la cuenta admin y una pestaña sin sesión:\n1. Sin sesión: Mascotas perdidas → Mapa → tocar "La vi" en Toby, cargar un avistamiento con ubicación → aparece en el mapa.\n2. Con sesión: Reportar mascota perdida con foto de la cámara.\n3. ID Digital: ver el QR de Kiara, "Ver ficha" → ficha pública con alergias.\n4. Denuncias: Seguir denuncia con el código 3611F2CD.\n5. Panel Admin → Veterinarias → Aprobar "Consultorio Dra. Méndez" → aparece en el directorio.\n6. Campana: notificaciones de las respuestas del chat.\nSi falla la conexión: reproducir docs/video/koko-demo.mp4.');
  const pasos = [
    ['1', 'Sin cuenta: mapa y "La vi"', 'Un vecino reporta dónde vio a Toby'],
    ['2', 'Publicar mascota perdida', 'Foto con la cámara y ubicación GPS'],
    ['3', 'Chapa QR y ficha pública', 'Kiara: alergias, llamar, WhatsApp'],
    ['4', 'Seguir una denuncia', 'Código 3611F2CD → estado en revisión'],
    ['5', 'Panel admin', 'Aprobar la veterinaria pendiente'],
    ['6', 'Notificaciones', 'Respuestas del chat en la campana'],
  ];
  pasos.forEach(([n, t, d], i) => {
    const y = 1.1 + i * 0.68;
    circuloIcono(s, 0.5, y + 0.02, C.verde, n);
    s.addText(t, { x: 1.1, y, w: 4.2, h: 0.3, fontFace: FUENTE, fontSize: 14, bold: true, color: C.texto, isTextBox: true, margin: 0 });
    s.addText(d, { x: 1.1, y: y + 0.3, w: 4.2, h: 0.3, fontFace: FUENTE, fontSize: 11.5, color: C.suave, isTextBox: true, margin: 0 });
  });
  telefono(s, join(IMG, 'movil-03-perdidas-mapa.png'), 5.8, 0.95, 4.35);
  telefono(s, join(IMG, 'movil-14-ficha-publica.png'), 8.05, 0.95, 4.35);
}

// ---------------------------------------------------------------------------
// 11. Estado y mejoras futuras
// ---------------------------------------------------------------------------
{
  const s = nueva('Estado del proyecto y mejoras futuras', 1, 'Ser honestos con lo que falta: lo documentamos como "parcial" o "pendiente" en la Etapa 2. Lo próximo es habilitar el pago con tarjeta (falta el webhook que actualiza lo recaudado), tiempo real para chat y notificaciones, que el dueño marque su mascota como encontrada, estados de adopción, búsqueda por texto y login con Google.');
  tarjeta(s, 0.5, 1.15, 4.4, 4.05);
  s.addText('Funciona hoy', { x: 0.75, y: 1.3, w: 4, h: 0.4, fontFace: FUENTE, fontSize: 17, bold: true, color: C.verdeClaro, isTextBox: true, margin: 0 });
  vinetas(s, ['Los seis módulos con alta, edición y baja por su autor', 'Avistamientos sin cuenta, visibles en el mapa', 'QR generado en el dispositivo y ficha pública', 'Denuncias con código único y moderación', 'Verificación de veterinarias', 'Chat por publicación con notificación al dueño', 'Alertas por zona configurables', 'PWA instalable, modo claro y oscuro'], 0.75, 1.8, 4, 3.3, 12);
  tarjeta(s, 5.1, 1.15, 4.4, 4.05);
  s.addText('Próxima versión', { x: 5.35, y: 1.3, w: 4, h: 0.4, fontFace: FUENTE, fontSize: 17, bold: true, color: C.ambar, isTextBox: true, margin: 0 });
  vinetas(s, ['Donación con tarjeta (Stripe) y webhook de recaudación', 'Chat y notificaciones en tiempo real', 'El dueño marca su mascota como encontrada', 'Estados de adopción: en proceso, adoptado', 'Búsqueda por texto desde el inicio', 'Aviso al dueño desde la ficha QR', 'Login con Google', 'Horarios de veterinarias editables'], 5.35, 1.8, 4, 3.3, 12);
}

// ---------------------------------------------------------------------------
// 12. Conclusiones
// ---------------------------------------------------------------------------
{
  const s = nueva('Conclusiones y aprendizajes', 1, 'Qué aprendimos: la seguridad no se puede dejar para el final (la migración desde Base44 dejó la autoría sin asignar y ningún dueño podía editar lo suyo); una base compartida exige disciplina de migraciones; documentar el sistema real, con sus brechas, vale más que prometer. Dificultades: recursión en políticas RLS, sesión y onboarding pisándose, mapas sin coordenadas. Cerrar con la frase de la portada y agradecer.');
  const items = [
    ['Seguridad desde el diseño', 'RLS, autoría del lado del servidor y funciones con privilegios acotados. Lo que se dejó para después costó el doble.', C.verdeClaro],
    ['Iterar sobre algo que funciona', 'Cada fase terminó con una versión usable; los errores se encontraron probando en el celular.', C.azul],
    ['Documentar la realidad', 'Requisitos con estado real y trazabilidad al código: el tribunal ve el sistema que existe.', C.ambar],
    ['Trabajo en equipo', 'Ramas, Pull Requests revisados y una base compartida con reglas claras.', C.rosa],
  ];
  items.forEach(([t, d, color], i) => {
    const col = i % 2, fila = Math.floor(i / 2);
    const x = 0.5 + col * 4.65, y = 1.15 + fila * 1.75;
    tarjeta(s, x, y, 4.4, 1.55);
    circuloIcono(s, x + 0.2, y + 0.2, color, '✓');
    s.addText(t, { x: x + 0.75, y: y + 0.18, w: 3.5, h: 0.45, fontFace: FUENTE, fontSize: 15, bold: true, color: C.texto, isTextBox: true, margin: 0, valign: 'middle' });
    s.addText(d, { x: x + 0.2, y: y + 0.72, w: 4, h: 0.75, fontFace: FUENTE, fontSize: 11.5, color: C.suave, isTextBox: true, margin: 0 });
  });
  s.addText('¡Gracias! · github.com/luanasegobia/koko-app', { x: 0.5, y: 4.75, w: 9, h: 0.4, fontFace: FUENTE, fontSize: 14, color: C.verdeClaro, align: 'center', isTextBox: true, margin: 0 });
}

// ---------------------------------------------------------------------------
// Salidas
// ---------------------------------------------------------------------------
const salidaPptx = join(DOCS, 'presentacion', 'Koko-Presentacion.pptx');
await pres.writeFile({ fileName: salidaPptx });
console.log(`✓ ${salidaPptx}`);

const total = guion.reduce((a, g) => a + g.minutos, 0);
const md = `# Etapa 8 — Presentación

**Proyecto:** Koko App · Conectando Huellas

**Documento:** 8 de 8 · Guion de la defensa (${total} minutos, ${guion.length} diapositivas)

---

Las diapositivas están en \`docs/presentacion/Koko-Presentacion.pptx\` (se generan con
\`node scripts/generar-presentacion.mjs\`; las notas del presentador van dentro del archivo).
El manual de usuario es el documento 7. El video de respaldo de la demo está en
\`docs/video/koko-demo.mp4\`.

## Guion

| # | Diapositiva | Minutos | Qué decir |
|---|---|---|---|
${guion.map((g) => `| ${g.numero} | ${g.titulo} | ${g.minutos} | ${g.notas.replace(/\n/g, ' ')} |`).join('\n')}

## Antes de la defensa

1. Entrar al panel de Supabase y confirmar que el proyecto está activo (los del plan gratuito se pausan por inactividad).
2. Iniciar sesión en el celular con la cuenta administradora y en otra pestaña o celular sin sesión.
3. Verificar que las cuentas de demo existen (\`supabase/seed_demo.sql\`) y que el código de denuncia 3611F2CD sigue vigente.
4. Tener el video \`docs/video/koko-demo.mp4\` descargado en la computadora de la presentación.
5. Compartir datos del celular si el aula no tiene conexión.

## Posibles preguntas del tribunal

| Pregunta | Respuesta breve |
|---|---|
| ¿Por qué Supabase y no un backend propio? | Autenticación, base, archivos y API en un solo servicio sin servidor que mantener; la seguridad se resuelve con políticas en la propia base. |
| ¿Cómo evitan que alguien publique a nombre de otro? | La autoría la asigna el servidor con \`DEFAULT auth.uid()\` y la política de inserción rechaza cualquier otro valor. |
| ¿Por qué los avistamientos no son una tabla? | Se leen siempre con su publicación, tienen tope de 50 y una función controlada los agrega; una tabla aparte sumaba políticas sin beneficio. |
| ¿Qué pasa si el usuario niega el GPS? | Todos los flujos funcionan con la dirección escrita; solo no aparece en el mapa. |
| ¿Qué falta para producción? | Publicar la app con URL propia, habilitar Stripe con su webhook, tiempo real, y las mejoras listadas en la diapositiva 11. |
`;
writeFileSync(join(DOCS, '08-presentacion.md'), md);
console.log('✓ docs/08-presentacion.md');
