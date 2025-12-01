import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.FamilyVaultapp',
  appName: 'Family-Vault-app',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
