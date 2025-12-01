import { createRoot } from "react-dom/client";
import { SocialLogin } from '@capgo/capacitor-social-login';
import App from "./App.tsx";
import "./index.css";

// Initialize SocialLogin for all platforms
SocialLogin.initialize({
  google: {
    webClientId: '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com',
  }
});

createRoot(document.getElementById("root")!).render(<App />);
