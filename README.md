# Conectando Huellas - Koko App 🐾

Bienvenido al repositorio de Koko App. Esta aplicación fue inicialmente construida con Base44 pero ahora ha sido migrada para funcionar con un backend personalizado basado en **Supabase**.

## Prerrequisitos

Para ejecutar este proyecto en tu entorno local, asegúrate de tener instalado [Node.js](https://nodejs.org/).

## Cómo ejecutar la app en modo local

1. **Clonar el repositorio** y navegar al directorio del proyecto:
   ```bash
   git clone https://github.com/luanasegobia/koko-app.git
   cd koko-app
   ```

2. **Instalar las dependencias**:
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**:
   Crea un archivo llamado `.env.local` en la raíz del proyecto. Este archivo debe contener las credenciales de conexión a tu proyecto de Supabase:
   ```env
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-key-publica
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_tu-clave-publica
   ```

   La clave secreta de Stripe no va acá: se configura como secret de la Edge Function
   `create-checkout-session` con `supabase secrets set STRIPE_SECRET_KEY=sk_test_...`.

4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre tu navegador y dirígete a `http://localhost:5173`.

## Base de Datos (Supabase)

Asegúrate de que tu proyecto en Supabase tenga las tablas requeridas. El script SQL completo (tablas, índices y políticas RLS) vive en `supabase/migrations/`. Podés aplicarlo de dos formas:

- Pegando el contenido del archivo en el SQL Editor de tu panel de Supabase.
- O, con la [CLI de Supabase](https://supabase.com/docs/guides/local-development) enlazada al proyecto:
  ```bash
  supabase db push
  ```

## Tests

El proyecto usa [Vitest](https://vitest.dev/) con Testing Library sobre jsdom:

```bash
npm test
```
