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

  // Create the 'default' channel for Local Notifications (Android 8+)
  // This is REQUIRED for notifications to display
  LocalNotifications.createChannel({
    id: 'default',
    name: 'Default Notifications',
    description: 'Family Vault notifications',
    importance: 5, // IMPORTANCE_HIGH
    visibility: 1, // PUBLIC
    sound: 'default',
    vibration: true,
  }).then(() => {
    console.log('Local notification channel created');
  }).catch(err => {
    console.log('Channel already exists or error:', err);
  });

  initializePushNotifications(
    async (notification) => {
      console.log('Push notification received in foreground:', notification.title);

      // When app is in foreground, FCM doesn't show system notification
      // So we create a local notification to display it
      try {
        // Use modulo to ensure ID fits in 32-bit signed integer (max: 2147483647)
        const notificationId = Math.floor(Math.random() * 2147483647);

        await LocalNotifications.schedule({
          notifications: [
            {
              id: notificationId,
              title: notification.title || 'Family Vault',
              body: notification.body || '',
              sound: 'default',
              smallIcon: 'ic_notification', // Monochrome icon in drawable
              channelId: 'default',
            }
          ]
        });
        console.log('Local notification shown for foreground push, id:', notificationId);
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
