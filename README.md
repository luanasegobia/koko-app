# Conectando Huellas — Koko App 🐾

Aplicación comunitaria para mascotas: reporte de mascotas perdidas, adopciones, red de
veterinarias, identificación con QR, denuncias por maltrato y casos urgentes.

**Ionic 9 + Angular 21** (componentes standalone, signals, Reactive Forms), con **Supabase**
como backend (base de datos, autenticación y almacenamiento de archivos). Capacitor permite
empaquetarla como app nativa para Android.

---

## Puesta en marcha

**No hace falta Docker ni la CLI de Supabase para desarrollar.** El equipo comparte
un único proyecto de Supabase en la nube: alcanza con las claves en un archivo local.

### 1. Clonar e instalar

```bash
git clone https://github.com/luanasegobia/koko-app.git
```

```bash
cd koko-app && npm install
```

Necesitás [Node.js](https://nodejs.org/) **22 LTS** (Angular 21 también acepta 20.19+ y 24;
con una versión impar como la 25 funciona pero avisa que no está soportada).

### 2. Configurar las credenciales

Copiá la plantilla y completá los valores:

```bash
cp .env.example .env.local
```

En Windows (PowerShell): `Copy-Item .env.example .env.local`

Las dos claves de Supabase salen del panel del proyecto compartido, en
**Project Settings → API**. Si todavía no tenés acceso, pedíselas a alguien del equipo.

> Usá siempre la clave **anon public**. La `service_role` saltea todas las políticas de
> seguridad y, como el código del navegador es público, dejaría la base abierta para
> cualquiera. La app rechaza esa clave y te avisa si la pegás por error.

`.env.local` está en el `.gitignore` y nunca se sube.

**Cómo llegan las variables a Angular:** Angular no lee archivos `.env`. El script
`scripts/generar-entorno.mjs` convierte `.env.local` en `src/environments/entorno.local.ts`
(también ignorado por git) antes de cada `npm run dev`, `npm run build` y `npm test`. Si
cambiás un valor, reiniciá el servidor. Un `.env.local` de la versión anterior (con nombres
`VITE_*`) sigue funcionando.

### 3. Levantar el servidor

```bash
npm run dev
```

Abrí `http://localhost:5175`. El puerto es fijo porque los correos de recuperación de
contraseña de Supabase apuntan a esa dirección.

Si falta algo del paso 2, la app no arranca en blanco: muestra una pantalla que dice
exactamente qué falta y cómo resolverlo.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── app.component.ts        Raíz: ion-app + ion-router-outlet (o la pantalla de configuración)
│   ├── app.config.ts           Proveedores: router, Ionic, manejador de errores
│   ├── app.routes.ts           Mapa de rutas, con carga perezosa y guardias
│   ├── iconos.ts               Registro de Ionicons usados en la app
│   ├── core/
│   │   ├── modelos.ts          Interfaces que reflejan las tablas de Supabase
│   │   ├── errores.ts          Errores tipados (configuración, datos, permisos, archivos)
│   │   ├── mensaje-de-error.ts Traduce cualquier error a una frase para la persona
│   │   ├── guardias/           autenticadoGuard y perfilCompletoGuard
│   │   ├── pipes/              fecha y haceTiempo (date-fns en español)
│   │   └── servicios/          SupabaseService, AuthService, NotificacionesService,
│   │                           TemaService, GestorChatService, StripeService, Avisos...
│   ├── layout/app-layout/      Menú lateral (split pane) + outlet de las páginas
│   ├── compartido/             Componentes reutilizables: cabecera, mapa (Leaflet),
│   │                           chat rápido, notificaciones, selector de foto, etc.
│   └── paginas/                Una carpeta por pantalla: login, registro, inicio,
│                               perdidas, adopcion, veterinarias, identificacion,
│                               denuncias, casos-urgentes, admin, ficha-publica...
├── environments/
│   ├── entorno.ts              Validación perezosa de las variables de entorno
│   └── entorno.local.ts        GENERADO desde .env.local (no se versiona)
├── theme/variables.scss        Paleta de Koko sobre las variables de Ionic (claro y oscuro)
└── global.scss                 Tipografías y clases utilitarias compartidas
supabase/
├── migrations/                 Esquema de la base, un archivo por cambio
└── functions/                  Edge Functions (sesión de pago de Stripe)
```

Convenciones: páginas `nombre.page.ts`, componentes `nombre.component.ts`, servicios
`nombre.service.ts`. Todo en español salvo los nombres de columna de la base. Las reglas
completas están en [`.agents/AGENTS.md`](.agents/AGENTS.md).

---

## Configuración del panel de Supabase

Estos ajustes **no viven en el repositorio**: se hacen una sola vez desde el panel del
proyecto. `supabase/config.toml` tiene los mismos valores, pero ese archivo solo lo lee un
stack local de Supabase; el proyecto en la nube lo ignora.

### Enlaces de correo y vuelta al sitio

Sin esto, el enlace de "olvidé mi contraseña" y el login con Google no saben a dónde volver.

**Authentication → URL Configuration**

| Campo | Valor |
|---|---|
| Site URL | `http://localhost:5175` |
| Redirect URLs | `http://localhost:5175/**` |

> ⚠️ El **Site URL** es el destino por defecto de los correos de autenticación. Mientras no
> haya nada desplegado, `localhost` está bien. **El día que se publique la app hay que
> cambiarlo por la URL real**, o los correos van a mandar a cada persona a su propia
> máquina. La entrada de Redirect URLs con `localhost` puede quedarse: solo sirve para
> desarrollo.

### Login con Google (opcional)

Todavía no está habilitado. Para activarlo: **Authentication → Providers → Google**, cargar
el Client ID y el Client Secret de Google Cloud, y registrar allá la URL de retorno que el
panel muestra (`https://<ref>.supabase.co/auth/v1/callback`).

Mientras esté deshabilitado, el botón "Continuar con Google" va a dar error. El acceso con
email y contraseña funciona igual.

---

## Convertirse en administrador

El panel de `/admin` (verificar veterinarias, moderar denuncias, cambiar estados) requiere
la marca `es_admin`. Por seguridad **esa columna no se puede escribir desde la aplicación**:
si se pudiera, cualquiera se haría admin solo. La única forma es desde el SQL Editor del
panel de Supabase:

```sql
update public.profiles p
   set es_admin = true
  from auth.users u
 where u.id = p.id
   and u.email = 'poner.aca@tu.email';
```

Para verificar quién es admin:

```sql
select u.email, p.tipo_cuenta, p.es_admin, p.profile_completed
  from public.profiles p
  join auth.users u on u.id = p.id
 order by p.created_at desc;
```

**Después de correrlo, cerrá sesión y volvé a entrar.** El permiso se lee una sola vez al
iniciar sesión, así que en la sesión actual no aparece.

---

## Base de datos

El esquema completo (tablas, índices, funciones y políticas de seguridad) vive versionado
en `supabase/migrations/`, un archivo por cambio.

**Para desarrollar no necesitás tocar nada de esto**: el proyecto compartido ya tiene todas
las migraciones aplicadas.

Solo si vas a modificar el esquema:

1. Instalá la [CLI de Supabase](https://supabase.com/docs/guides/local-development).
2. Enlazá el repo con el proyecto (esto se hace **una sola vez**, y es indispensable antes
   de cualquier `db push`):
   ```bash
   supabase link --project-ref knvocftylpunbzycoarx
   ```
3. Creá tu migración como un archivo nuevo en `supabase/migrations/` (nunca editando uno
   existente) y aplicala:
   ```bash
   supabase db push
   ```

> ⚠️ **La base de desarrollo es compartida entre las tres personas del equipo.** Una
> migración la aplica una sola persona y avisa al resto. Cambios destructivos (borrar
> columnas o tablas) se conversan antes.

---

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo en `http://localhost:5175` |
| `npm test` | Tests unitarios con Vitest sobre jsdom |
| `npm run test:watch` | Tests en modo interactivo |
| `npm run lint` | Revisa el estilo del código (ESLint + angular-eslint) |
| `npm run lint:fix` | Arregla lo que se pueda arreglar solo |
| `npm run build` | Compila para producción en `www/` |
| `npm run preview` | Sirve lo compilado, para probarlo |
| `npm run generar-entorno` | Regenera `entorno.local.ts` a mano (los demás comandos ya lo hacen) |

---

## App nativa (Capacitor)

La app es una PWA y además puede empaquetarse como app de Android con
[Capacitor](https://capacitorjs.com/). Hace falta Android Studio.

```bash
npm run build
```

```bash
npx cap add android
```

```bash
npx cap open android
```

Cada vez que cambie el código web: `npm run build && npx cap sync`.

---

## Estado del proyecto

La app se construyó originalmente en Base44, se migró a Supabase y después se reescribió de
React a **Ionic + Angular**. La base de datos y las funcionalidades quedaron intactas; cambió
solo la capa de interfaz.

**Fuera de alcance por ahora** (funcionan de forma degradada, sin romper nada):

- **Donaciones con tarjeta (Stripe).** Sin `STRIPE_PUBLISHABLE_KEY` el botón queda
  deshabilitado. Las donaciones por alias bancario siguen funcionando normalmente.
- **Chat y notificaciones en tiempo real.** Los mensajes se cargan al abrir la
  conversación, pero todavía no llegan solos (`HABILITAR_TIEMPO_REAL`).
- **Alertas por cercanía.** El sondeo está apagado por defecto (`HABILITAR_ALERTAS`).

---

## Contribuir

Leé [CONTRIBUTING.md](CONTRIBUTING.md) antes del primer PR. En resumen: nunca se commitea
directo a `main`, las ramas y los commits van en español, y antes de abrir un PR corré
`npm run lint`, `npm test` y `npm run build`.
