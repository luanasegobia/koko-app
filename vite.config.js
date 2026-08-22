import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  logLevel: 'error',
  plugins: [
    react(),
  ],
  server: {
    // 5173 lo ocupa otro proyecto, y el puerto tiene que ser fijo porque los
    // mails de recuperación de Supabase apuntan a window.location.origin.
    port: Number(process.env.PORT) || 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
});