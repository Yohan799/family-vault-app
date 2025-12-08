import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from '@/integrations/supabase/client';

// Check if push notifications are available (native platform only)
export const isPushAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

// Request permission for push notifications
export const requestPushPermission = async (): Promise<boolean> => {
  if (!isPushAvailable()) {
    console.log('Push notifications not available on this platform');
    return false;
  }

  try {
    const permissionStatus = await PushNotifications.checkPermissions();

    if (permissionStatus.receive === 'granted') {
      return true;
    }

    if (permissionStatus.receive === 'prompt') {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    }

    return false;
  } catch (error) {
    console.error('Error requesting push permission:', error);
    return false;
  }
};

// Register device for push notifications
export const registerDevice = async (userId: string): Promise<boolean> => {
  if (!isPushAvailable()) {
    console.log('Push notifications not available on this platform');
    return false;
  }

  try {
    const hasPermission = await requestPushPermission();
    if (!hasPermission) {
      console.log('Push notification permission denied');
      return false;
    }

    // Register with FCM
    await PushNotifications.register();
    return true;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
};

// Save device token to database
export const saveDeviceToken = async (userId: string, token: string): Promise<boolean> => {
  try {
    const deviceName = Capacitor.getPlatform();

    const { error } = await supabase
      .from('device_tokens')
      .upsert({
        user_id: userId,
        token: token,
        platform: deviceName,
        device_name: `${deviceName} device`,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,token'
      });

    if (error) {
      console.error('Error saving device token:', error);
      return false;
    }

    console.log('Device token saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving device token:', error);
    return false;
  }
};

// Unregister device (remove token from database)
export const unregisterDevice = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing device token:', error);
      return false;
    }

    console.log('Device token removed successfully');
    return true;
  } catch (error) {
    console.error('Error removing device token:', error);
    return false;
  }
};

// Initialize push notification listeners
export const initializePushNotifications = (
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationTapped?: (notification: ActionPerformed) => void
): void => {
  if (!isPushAvailable()) {
    return;
  }

  // Listen for registration success
  PushNotifications.addListener('registration', async (token: Token) => {
    console.log('Push registration success, token:', token.value);

    // Get current user and save token
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await saveDeviceToken(user.id, token.value);
    }
  });

  // Listen for registration errors
  PushNotifications.addListener('registrationError', (error) => {
    console.error('Push registration error:', error);
  });

  // Listen for push notifications received while app is in foreground
  PushNotifications.addListener('pushNotificationReceived', async (notification: PushNotificationSchema) => {
    console.log('Push notification received:', notification);

    // Show local notification for foreground pushes on Android
    if (Capacitor.getPlatform() === 'android') {
      try {
        await LocalNotifications.schedule({
          notifications: [{
            title: notification.title || 'Notification',
            body: notification.body || '',
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: new Date(Date.now() + 100) },
            extra: notification.data,
          }]
        });
        console.log('Local notification scheduled for foreground push');
      } catch (err) {
        console.error('Error scheduling local notification:', err);
      }
    }

    onNotificationReceived?.(notification);
  });

  // Listen for notification action (when user taps notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
    console.log('Push notification action performed:', notification);
    onNotificationTapped?.(notification);
  });
};

// Clean up listeners
export const removePushListeners = async (): Promise<void> => {
  if (!isPushAvailable()) {
    return;
  }

  await PushNotifications.removeAllListeners();
};
