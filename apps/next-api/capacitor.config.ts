import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fracturedearth',
  appName: 'Fractured Earth',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    hostname: 'fracturedearth.app', // Virtual hostname for the Android app
    cleartext: true, // For development flexibility
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#020305',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020305',
      overlaysWebView: true, // Allows using env(safe-area-inset-top) correctly
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
    },
    AdMob: {
      // AdMob config can be added here if needed for plugin-specific settings
    }
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  }
};

export default config;
