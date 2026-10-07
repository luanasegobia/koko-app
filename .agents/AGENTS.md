# Reglas de Agentes para Koko App

Estas reglas de personalización aplican a cualquier agente de inteligencia artificial que asista en el desarrollo de este repositorio.

## 1. Idioma y Nomenclatura (Español Estricto)
- **Código Fuente:** Todas las variables, nombres de funciones, clases, comentarios y documentación interna deben estar escritos en **español**. La única excepción son los nombres de columna de la base de datos (`pet_name`, `created_at`), que se mantienen en inglés porque así están en `supabase/migrations/`.
- **Interfaz (UI):** Todos los textos visibles por el usuario deben estar en **español** (voseo rioplatense, como el resto de la app).
- **Commits:** Los mensajes de commit deben redactarse en español.

## 2. Base de Datos y Backend
- **Supabase:** Todo el almacenamiento de datos, autenticación de usuarios (Auth) y almacenamiento de archivos (Storage) debe realizarse obligatoriamente utilizando el cliente oficial de **Supabase**, siempre a través de `SupabaseService` (`src/app/core/servicios/supabase.service.ts`). Ningún componente crea su propio cliente ni importa `@supabase/supabase-js` directamente.
- Nunca se deben usar librerías heredadas, configuraciones locales falsas, ni Base44. Todo debe consultar a la API REST o Realtime de Supabase.
- Las variables de entorno se leen **solo** desde `src/environments/entorno.ts`. El archivo `entorno.local.ts` lo genera `scripts/generar-entorno.mjs` a partir de `.env.local` y nunca se versiona.

## 3. Interfaz y Estilos (Ionic)
- **Componentes de Ionic:** La interfaz se construye con los componentes de `@ionic/angular` (`ion-content`, `ion-card`, `ion-button`, `ion-input`, `ion-modal`, `ion-segment`, etc.). No se instalan otras librerías de componentes.
- **Íconos:** Se usan **Ionicons**. Cada ícono nuevo se registra en `src/app/iconos.ts` (con los componentes standalone de Ionic solo se incluyen en el bundle los íconos registrados).
- **Estilos:** SCSS por componente, usando las **variables de tema de Ionic** (`--ion-color-primary`, `--ion-background-color`, etc.) y las propias de Koko (`--koko-*`) definidas en `src/theme/variables.scss`. Los colores nunca se escriben a mano en los componentes: se agregan como variables al tema. Las clases utilitarias compartidas viven en `src/global.scss`.
- **Modo oscuro:** Lo maneja `TemaService` con la clase `ion-palette-dark`; cualquier color nuevo necesita su variante oscura en `variables.scss`.

## 4. Estilo de Código (Angular)
- **Componentes standalone:** Todos los componentes son standalone (sin `NgModule`) e importan explícitamente lo que usan.
- **Signals:** El estado de los componentes se maneja con `signal`, `computed` e `input()`/`output()`/`model()`. No se usan decoradores `@Input()`/`@Output()` ni `BehaviorSubject` para estado local.
- **Inyección:** Se usa `inject()` en vez de inyección por constructor.
- **Formularios:** Siempre **Reactive Forms** (`FormBuilder.nonNullable.group`), con `Validators` de Angular. Los errores se muestran con `errorText` de los `ion-input`.
- **Servicios:** La lógica de datos vive en servicios de `src/app/core/servicios/`, nunca en los componentes. Los servicios devuelven `Promise`.
- **Control de flujo:** Se usa la sintaxis nueva de plantillas (`@if`, `@for`, `@switch`), no `*ngIf`/`*ngFor`.
- **Convención de archivos:** páginas `nombre.page.ts`, componentes `nombre.component.ts`, servicios `nombre.service.ts`, guardias `nombre.guard.ts`, pipes `nombre.pipe.ts`. Cada componente en su propia carpeta o archivo.
- **Carga perezosa:** Cada página se registra en `app.routes.ts` con `loadComponent`.

## 5. Control de Versiones (Git)
- **Nunca trabajar sobre `main`:** Antes de modificar código, si la rama actual es `main` se debe crear una rama nueva (`git checkout -b feat/nombre-descriptivo`). Los cambios llegan a `main` únicamente mediante Pull Request.
- **Prefijos de rama:** `feat/`, `fix/`, `refactor/`, `chore/` o `docs/` según el tipo de cambio.
- **Push y merge:** No ejecutar `git push` ni mergear a `main` salvo pedido explícito de la persona con la que se trabaja.
- **Reportar la rama:** Al terminar, indicar siempre en qué rama quedaron los commits.
- El flujo completo, la convención de commits y el checklist previo al Pull Request están documentados en [`CONTRIBUTING.md`](../CONTRIBUTING.md).
