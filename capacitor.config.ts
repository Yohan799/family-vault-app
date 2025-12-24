import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.FamilyVaultapp',
  appName: 'Family-Vault-app',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      launchFadeOutDuration: 500,
      backgroundColor: "#FFFFFF",
      androidScaleType: "FIT_CENTER",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    SocialLogin: {
      google: {
        webClientId: '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com',
      }
    }
  }
};

export default config;
