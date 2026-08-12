# Conectando Huellas — Koko App 🐾

Aplicación comunitaria para mascotas: reporte de mascotas perdidas, adopciones, red de
veterinarias, identificación con QR, denuncias por maltrato y casos urgentes.

Vite + React 18 + Tailwind + shadcn/ui, con **Supabase** como backend
(base de datos, autenticación y almacenamiento de archivos).

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

Necesitás [Node.js](https://nodejs.org/) 20 o superior.

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

### 3. Levantar el servidor

```bash
npm run dev
```

Abrí `http://localhost:5173`.

Si falta algo del paso 2, la app no arranca en blanco: muestra una pantalla que dice
exactamente qué falta y cómo resolverlo.

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
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173` |
| `npm test` | Tests con Vitest sobre jsdom |
| `npm run test:watch` | Tests en modo interactivo |
| `npm run lint` | Revisa el estilo del código |
| `npm run lint:fix` | Arregla lo que se pueda arreglar solo |
| `npm run build` | Compila para producción |
| `npm run preview` | Sirve lo compilado, para probarlo |

---

## Estado del proyecto

La app se construyó originalmente en Base44 y se migró a Supabase. La interfaz quedó
intacta; la capa de datos se está reconstruyendo por fases.

**Fuera de alcance por ahora** (funcionan de forma degradada, sin romper nada):

- **Donaciones con tarjeta (Stripe).** Sin `VITE_STRIPE_PUBLISHABLE_KEY` el botón queda
  deshabilitado. Las donaciones por alias bancario siguen funcionando normalmente.
- **Chat y notificaciones en tiempo real.** Los mensajes se cargan al abrir la
  conversación, pero todavía no llegan solos.

---

## Contribuir

Leé [CONTRIBUTING.md](CONTRIBUTING.md) antes del primer PR. En resumen: nunca se commitea
directo a `main`, las ramas y los commits van en español, y antes de abrir un PR corré
`npm run lint`, `npm test` y `npm run build`.
