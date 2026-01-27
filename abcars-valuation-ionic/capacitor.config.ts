import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abcars.valuation',
  appName: 'ABCars Valuación',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;

