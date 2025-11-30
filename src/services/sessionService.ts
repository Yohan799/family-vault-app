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

  return { deviceType, deviceName };
};

export const createSession = async (userId: string): Promise<void> => {
  const { deviceType, deviceName } = getDeviceInfo();

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
