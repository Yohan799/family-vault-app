import { createRoot } from "react-dom/client";
import { SocialLogin } from '@capgo/capacitor-social-login';
import App from "./App.tsx";
import "./index.css";
import { initializePushNotifications, isPushAvailable } from "@/services/pushNotificationService";

// Initialize SocialLogin for all platforms
SocialLogin.initialize({
  google: {
    webClientId: '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com',
  }
});

// Initialize push notifications on native platforms
if (isPushAvailable()) {
  initializePushNotifications(
    (notification) => {
      console.log('Push notification received:', notification.title);
    },
    (action) => {
      console.log('Push notification tapped:', action.notification.title);
      // Navigation can be handled here based on notification data
    }
  );
}

createRoot(document.getElementById("root")!).render(<App />);
