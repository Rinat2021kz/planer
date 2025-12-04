import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.adifirst.planer',
  appName: 'planer',
  webDir: 'dist/client',
  

    // server: {
    //   url: 'https://planer.gassimov2014.workers.dev',
    //   androidScheme: 'https',
    //    iosScheme: 'https',
    // },

  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#999999',
      splashFullScreen: true,
      splashImmersive: true,
    },
    "EdgeToEdge": {
      "backgroundColor": "#000000"
    }
  },
};

export default config;
