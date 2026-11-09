# Documentación del proyecto — Prácticas Profesionalizantes III

Documentación académica de **Koko App / Conectando Huellas**, organizada según las ocho
etapas de la guía de la materia. Cada etapa es un archivo Markdown en esta carpeta; los
PDF para la entrega se generan a partir de ellos (ver más abajo).

## Estado por etapa

| Etapa | Documento | Estado |
|---|---|---|
| 0 | [Portada y datos del equipo](00-portada.md) | ⚠️ Completar nombres, docente y fecha |
| 1 | [Análisis del problema](01-analisis-del-problema.md) | ✅ Redactado |
| 2 | [Ingeniería de requisitos](02-requisitos.md) | ✅ Redactado |
| 3 | [Casos de uso](03-casos-de-uso.md) | ✅ Redactado |
| 4 | [Diagramas UML](04-diagramas-uml.md) (componentes, clases, secuencia, flujo, estados) | ✅ Redactado |
| 5 | [Planificación con RUP](05-planificacion-rup.md) | ✅ Redactado · ⚠️ Completar roles y fecha de entrega |
| 6 | [Diseño de base de datos](06-diseno-base-de-datos.md) (DER, diccionario, RLS) | ✅ Redactado |
| 7 | Desarrollo · [Manual de usuario](07-manual-de-usuario.md) | ✅ El código es este repositorio (ver [README](../README.md)); manual con capturas en `capturas/` |
| 8 | [Presentación](08-presentacion.md) · `presentacion/Koko-Presentacion.pptx` · video de respaldo `video/koko-demo.mp4` | ✅ Generados · ⚠️ Completar integrantes y docente en la portada de la presentación |

## Regenerar capturas, presentación y video

- **Capturas** (`capturas/`): se sacan con un script de Puppeteer sobre la app corriendo en
  `localhost:5175` con los datos de `supabase/seed_demo.sql` cargados; escritorio en modo
  claro (1280×800) y celular en modo oscuro a página completa (390×844 @2x).
- **Presentación**: `node scripts/generar-presentacion.mjs` escribe el `.pptx` (con notas
  del presentador) y el guion `08-presentacion.md` desde la misma lista de diapositivas.
  Las imágenes de diagramas y los recortes de celular están en `presentacion/img/`.
- **Video de respaldo**: proyecto HyperFrames en `video/`. Con las capturas actualizadas:
  `node armar-assets.mjs`, `npm run check` y `npm run render -- --output koko-demo.mp4`
  (requiere Node 22+, FFmpeg y Chrome).

## Convenciones

- **Identificadores.** Los requisitos se numeran `RF-xx` (funcionales), `RNF-xx` (no
  funcionales) y `RD-xx` (de datos). Los casos de uso, `CU-xx`. Los diagramas y el diseño
  de base de datos remiten a esos identificadores para mantener la trazabilidad.
- **Estado de implementación.** Cada requisito indica si está *Implementado*, *Parcial* o
  *Pendiente* en el código actual, con referencia al archivo que lo resuelve. Esto es
  deliberado: el tribunal evalúa que la documentación describa el sistema real.
- **Diagramas.** Están escritos en [Mermaid](https://mermaid.js.org/) dentro del propio
  Markdown, así se versionan junto al texto y GitHub los renderiza solo.

## Generar los PDF

```bash
npm run docs:pdf
```

Deja un PDF por etapa en `docs/pdf/`, con los diagramas Mermaid ya renderizados. Requiere
Google Chrome o Microsoft Edge instalado (se usa en modo sin ventana para imprimir).
