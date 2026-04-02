import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fracturedearth',
  appName: 'Fractured Earth',
  webDir: 'dist/angular-mobile/browser',
  
  server: {
    hostname: 'localhost',
    androidScheme: 'https'
  },
  
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#000000',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#000000',
    },
    Preferences: {
      group: 'fractured_earth_data'
    },
  },
  
  android: {
    allowMixedContent: true,
    captureInput: false,
    webContentsDebuggingEnabled: true, // Enabled for development parity
  },
};

export default config;
