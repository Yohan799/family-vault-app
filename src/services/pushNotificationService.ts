import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
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

    // Create a promise that resolves when we get the registration token
    const tokenPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Token registration timeout'));
      }, 10000); // 10 second timeout

      // Listen for the token
      PushNotifications.addListener('registration', (token) => {
        clearTimeout(timeout);
        console.log('FCM token received:', token.value.substring(0, 20) + '...');
        resolve(token.value);
      });

      // Listen for errors
      PushNotifications.addListener('registrationError', (error) => {
        clearTimeout(timeout);
        console.error('FCM registration error:', error);
        reject(new Error(error.error || 'Registration failed'));
      });
    });

    // Trigger FCM registration
    await PushNotifications.register();
    console.log('PushNotifications.register() called, waiting for token...');

    // Wait for the token
    const token = await tokenPromise;
    console.log('Token received, saving to database for user:', userId);

    // Save token to database
    const saved = await saveDeviceToken(userId, token);
    if (saved) {
      console.log('Device token saved successfully!');
    } else {
      console.error('Failed to save device token to database');
    }

    return saved;
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
