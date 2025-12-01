import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import App from "./App.tsx";
import "./index.css";

// Initialize GoogleAuth for web platform
if (!Capacitor.isNativePlatform()) {
  GoogleAuth.initialize({
    clientId: '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com',
    scopes: ['profile', 'email'],
    grantOfflineAccess: true,
  });
}

createRoot(document.getElementById("root")!).render(<App />);
