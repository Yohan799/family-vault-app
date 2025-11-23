import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  documents: number;
  nominees: number;
  timeCapsules: number;
  inactivityTriggerActive: boolean;
}

export const fetchDashboardStats = async (userId: string): Promise<DashboardStats> => {
  try {
    // Fetch documents count
    const { count: documentsCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null);

    // Fetch nominees count (only verified)
    const { count: nomineesCount } = await supabase
      .from('nominees')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'verified')
      .is('deleted_at', null);

    // Fetch time capsules count (only scheduled)
    const { count: timeCapsulesCount } = await supabase
      .from('time_capsules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .is('deleted_at', null);

    // Fetch inactivity trigger status
    const { data: inactivityTrigger } = await supabase
      .from('inactivity_triggers')
      .select('is_active')
      .eq('user_id', userId)
      .single();

    return {
      documents: documentsCount || 0,
      nominees: nomineesCount || 0,
      timeCapsules: timeCapsulesCount || 0,
      inactivityTriggerActive: inactivityTrigger?.is_active || false,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      documents: 0,
      nominees: 0,
      timeCapsules: 0,
      inactivityTriggerActive: false,
    };
  }
};

export const calculateReadinessScore = (
  stats: DashboardStats,
  twoFactorEnabled: boolean,
  biometricEnabled: boolean
): number => {
  let score = 0;
  // Each feature worth 20%
  if (twoFactorEnabled) score += 20;
  if (biometricEnabled) score += 20;
  if (stats.nominees > 0) score += 20;
  if (stats.timeCapsules > 0) score += 20;
  if (stats.inactivityTriggerActive) score += 20;
  return score;
};

export const updateInactivityTrigger = async (
  userId: string,
  isActive: boolean
): Promise<void> => {
  // Check if trigger exists
  const { data: existing } = await supabase
    .from('inactivity_triggers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    // Update existing
    await supabase
      .from('inactivity_triggers')
      .update({
        is_active: isActive,
        last_activity_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  } else {
    // Create new
    await supabase
      .from('inactivity_triggers')
      .insert({
        user_id: userId,
        is_active: isActive,
        last_activity_at: new Date().toISOString(),
      });
  }
};
