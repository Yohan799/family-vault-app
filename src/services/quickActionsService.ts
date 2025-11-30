import { supabase } from '@/integrations/supabase/client';

export interface QuickAction {
  id: string;
  user_id: string;
  action_key: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  route: string | null;
  is_enabled: boolean;
  is_custom: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const DEFAULT_ACTIONS = [
  { action_key: 'vault', title: 'Digital Vault', subtitle: 'Manage your secure documents', icon: 'Vault', route: '/vault', display_order: 0 },
  { action_key: 'nominees', title: 'Nominee Center', subtitle: 'Manage trusted contacts', icon: 'UserPlus', route: '/nominee-center', display_order: 1 },
  { action_key: 'inactivity', title: 'Inactivity Triggers', subtitle: 'Set up activity monitoring', icon: 'Shield', route: '/inactivity-triggers', display_order: 2 },
  { action_key: 'time-capsule', title: 'Time Capsule', subtitle: 'Create legacy messages', icon: 'Timer', route: '/time-capsule', display_order: 3 },
];

export const getQuickActions = async (userId: string): Promise<QuickAction[]> => {
  const { data, error } = await supabase
    .from('quick_actions')
    .select('*')
    .eq('user_id', userId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  
  return data || [];
};

export const initializeDefaultActions = async (userId: string): Promise<void> => {
  const { data: existing } = await supabase
    .from('quick_actions')
    .select('id')
    .eq('user_id', userId)
    .limit(1);

  // Only initialize if no actions exist
  if (existing && existing.length > 0) return;

  const actionsToInsert = DEFAULT_ACTIONS.map(action => ({
    user_id: userId,
    action_key: action.action_key,
    title: action.title,
    subtitle: action.subtitle,
    icon: action.icon,
    route: action.route,
    is_enabled: true,
    is_custom: false,
    display_order: action.display_order,
  }));

  const { error } = await supabase
    .from('quick_actions')
    .insert(actionsToInsert);

  if (error) throw error;
};

export const updateQuickAction = async (
  id: string,
  updates: Partial<Omit<QuickAction, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<void> => {
  const { error } = await supabase
    .from('quick_actions')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

export const createQuickAction = async (
  userId: string,
  action: {
    title: string;
    subtitle?: string;
    icon?: string;
    route?: string;
  }
): Promise<QuickAction> => {
  // Get max display_order
  const { data: maxOrder } = await supabase
    .from('quick_actions')
    .select('display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: false })
    .limit(1);

  const nextOrder = maxOrder && maxOrder.length > 0 ? maxOrder[0].display_order + 1 : 0;

  const { data, error } = await supabase
    .from('quick_actions')
    .insert({
      user_id: userId,
      action_key: `custom-${Date.now()}`,
      title: action.title,
      subtitle: action.subtitle || null,
      icon: action.icon || 'Plus',
      route: action.route || null,
      is_enabled: true,
      is_custom: true,
      display_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteQuickAction = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('quick_actions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const reorderQuickActions = async (
  userId: string,
  orderedIds: string[]
): Promise<void> => {
  const updates = orderedIds.map((id, index) => ({
    id,
    display_order: index,
  }));

  // Update each action's display_order
  for (const update of updates) {
    await supabase
      .from('quick_actions')
      .update({ display_order: update.display_order })
      .eq('id', update.id)
      .eq('user_id', userId);
  }
};
