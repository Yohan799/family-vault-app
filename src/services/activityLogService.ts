import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export const logActivity = async (
  userId: string,
  actionType: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, any>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        resource_type: resourceType || null,
        resource_id: resourceId || null,
        details: details || null,
      });

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
};

export const fetchActivityLogs = async (
  userId: string,
  limit: number = 50
): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as ActivityLog[];
};
