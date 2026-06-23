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
   ```

4. **Ejecutar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abre tu navegador y dirígete a `http://localhost:5173`.

## Base de Datos (Supabase)

Asegúrate de que tu proyecto en Supabase tenga las tablas requeridas. Puedes encontrar el script SQL completo para generar toda la base de datos en el archivo `schema.sql` (si no lo tienes en el repositorio, solicítalo al administrador). Simplemente pégalo en el SQL Editor de tu panel de Supabase para instanciar las tablas necesarias.
