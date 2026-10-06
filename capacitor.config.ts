import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Configuración de Capacitor, que empaqueta la app web como app nativa.
 *
 * Para generar el proyecto Android (requiere Android Studio):
 *   npm run build
 *   npx cap add android
 *   npx cap open android
 */
const config: CapacitorConfig = {
  appId: 'ar.com.koko.app',
  appName: 'Koko',
  webDir: 'www',
  server: {
    androidScheme: 'https',
  },
};

export default config;
