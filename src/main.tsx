import { createRoot } from "react-dom/client";
import { SocialLogin } from '@capgo/capacitor-social-login';
import { LocalNotifications } from '@capacitor/local-notifications';
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
  // Request local notification permissions for foreground display
  LocalNotifications.requestPermissions().then(permission => {
    console.log('Local notification permission:', permission.display);
  });

  initializePushNotifications(
    async (notification) => {
      console.log('Push notification received in foreground:', notification.title);

      // When app is in foreground, FCM doesn't show system notification
      // So we create a local notification to display it
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: Date.now(),
              title: notification.title || 'Family Vault',
              body: notification.body || '',
              sound: 'default',
              smallIcon: 'ic_stat_icon_config_sample',
              largeIcon: 'ic_launcher',
              channelId: 'default',
            }
          ]
        });
        console.log('Local notification shown for foreground push');
      } catch (err) {
        console.error('Error showing local notification:', err);
      }
    },
    (action) => {
      console.log('Push notification tapped:', action.notification.title);
      // Navigation can be handled here based on notification data
    }
  );
}

createRoot(document.getElementById("root")!).render(<App />);
