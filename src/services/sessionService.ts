import { supabase } from '@/integrations/supabase/client';

export interface UserSession {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  ip_address: string | null;
  location: string | null;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
}

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  let deviceName = 'Unknown Device';

  if (/mobile/i.test(ua)) {
    deviceType = 'mobile';
    if (/iPhone/i.test(ua)) deviceName = 'iPhone';
    else if (/Android/i.test(ua)) deviceName = 'Android Phone';
    else deviceName = 'Mobile Device';
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
    if (/iPad/i.test(ua)) deviceName = 'iPad';
    else deviceName = 'Tablet';
  } else {
    if (/Mac/i.test(ua)) deviceName = 'Mac';
    else if (/Windows/i.test(ua)) deviceName = 'Windows PC';
    else if (/Linux/i.test(ua)) deviceName = 'Linux PC';
    else deviceName = 'Desktop';
  }

  // Create a simple device fingerprint for comparison
  const deviceFingerprint = `${deviceType}-${deviceName}`;

  return { deviceType, deviceName, deviceFingerprint };
};

// Check if this is a new device for the user
const isNewDevice = async (userId: string, deviceName: string, deviceType: string): Promise<boolean> => {
  try {
    const { data: existingSessions } = await supabase
      .from('user_sessions')
      .select('device_name, device_type')
      .eq('user_id', userId);

    if (!existingSessions || existingSessions.length === 0) {
      // First login ever - not considered "new device" alert
      return false;
    }

    // Check if this device combination already exists
    const deviceExists = existingSessions.some(
      session => session.device_name === deviceName && session.device_type === deviceType
    );

    return !deviceExists;
  } catch (error) {
    console.error('Error checking for new device:', error);
    return false;
  }
};

// Send push notification for new device login
const sendNewDeviceNotification = async (userId: string, deviceName: string): Promise<void> => {
  try {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    await supabase.functions.invoke('send-push-notification', {
      body: {
        user_id: userId,
        title: '🔐 New Device Login',
        body: `New login from ${deviceName} at ${timeString} on ${dateString}. If this wasn't you, secure your account immediately.`,
        data: {
          type: 'new_device_login',
          device_name: deviceName,
          timestamp: now.toISOString(),
        },
      },
    });

    console.log('New device notification sent successfully');
  } catch (error) {
    console.error('Error sending new device notification:', error);
    // Don't throw - notification failure shouldn't block login
  }
};

export const createSession = async (userId: string): Promise<void> => {
  const { deviceType, deviceName } = getDeviceInfo();

  // Check if this is a new device before creating session
  const newDevice = await isNewDevice(userId, deviceName, deviceType);

  // Mark all existing sessions as not current
  await supabase
    .from('user_sessions')
    .update({ is_current: false })
    .eq('user_id', userId);

  // Create new session
  const { error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      device_name: deviceName,
      device_type: deviceType,
      is_current: true,
      last_active_at: new Date().toISOString(),
    });

  if (error) throw error;

  // Send notification if new device (after successful session creation)
  if (newDevice) {
    console.log('New device detected, sending security notification...');
    await sendNewDeviceNotification(userId, deviceName);
  }
};

export const fetchSessions = async (userId: string): Promise<UserSession[]> => {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_active_at', { ascending: false });

  if (error) throw error;
  return (data || []) as UserSession[];
};

export const updateSessionActivity = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) throw error;
};

export const endSession = async (sessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) throw error;
};

export const endAllOtherSessions = async (userId: string, currentSessionId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_sessions')
    .delete()
    .eq('user_id', userId)
    .neq('id', currentSessionId);

  if (error) throw error;
};
