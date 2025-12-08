import { supabase } from '@/integrations/supabase/client';

export interface Backup {
  id: string;
  user_id: string;
  backup_type: 'automatic' | 'manual';
  file_path: string;
  file_size: number | null;
  status: 'in_progress' | 'completed' | 'failed';
  created_at: string;
}

export interface LocalBackupData {
  version: string;
  createdAt: string;
  documents: any[];
  categories: any[];
  subcategories: any[];
  nominees: any[];
  timeCapsules: any[];
  inactivityTriggers: any[];
  profile: any;
}

export const fetchBackups = async (userId: string): Promise<Backup[]> => {
  const { data, error } = await supabase
    .from('backups')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Backup[];
};

export const createManualBackup = async (userId: string): Promise<void> => {
  // Call the edge function to create backup
  const { error } = await supabase.functions.invoke('create-backup', {
    body: { userId, backupType: 'manual' }
  });

  if (error) throw error;
};

export const downloadBackupFile = async (filePath: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('backups')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
};

export const deleteBackup = async (backupId: string, filePath: string): Promise<void> => {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('backups')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('backups')
    .delete()
    .eq('id', backupId);

  if (dbError) throw dbError;
};

// Create a local backup of all user data
export const createLocalBackup = async (userId: string): Promise<LocalBackupData | null> => {
  try {
    const [
      { data: documents },
      { data: categories },
      { data: subcategories },
      { data: nominees },
      { data: timeCapsules },
      { data: inactivityTriggers },
      { data: profile },
    ] = await Promise.all([
      supabase.from('documents').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('categories').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('subcategories').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('nominees').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('time_capsules').select('*').eq('user_id', userId).is('deleted_at', null),
      supabase.from('inactivity_triggers').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('id', userId).single(),
    ]);

    return {
      version: '2.0.0',
      createdAt: new Date().toISOString(),
      documents: documents || [],
      categories: categories || [],
      subcategories: subcategories || [],
      nominees: nominees || [],
      timeCapsules: timeCapsules || [],
      inactivityTriggers: inactivityTriggers || [],
      profile: profile || null,
    };
  } catch (error) {
    console.error('Error creating local backup:', error);
    return null;
  }
};

// Download local backup as JSON file
export const downloadLocalBackup = async (userId: string): Promise<boolean> => {
  try {
    const backup = await createLocalBackup(userId);
    if (!backup) return false;

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `familyvault-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading backup:', error);
    return false;
  }
};

// Validate backup file
export const validateLocalBackup = (data: any): data is LocalBackupData => {
  return (
    data &&
    typeof data.version === 'string' &&
    typeof data.createdAt === 'string' &&
    Array.isArray(data.documents) &&
    Array.isArray(data.categories) &&
    Array.isArray(data.subcategories) &&
    Array.isArray(data.nominees) &&
    Array.isArray(data.timeCapsules)
  );
};

// Get backup stats
export const getBackupStats = (backup: LocalBackupData): string => {
  const stats = [
    backup.documents.length > 0 ? `${backup.documents.length} documents` : null,
    backup.categories.length > 0 ? `${backup.categories.length} categories` : null,
    backup.nominees.length > 0 ? `${backup.nominees.length} nominees` : null,
    backup.timeCapsules.length > 0 ? `${backup.timeCapsules.length} time capsules` : null,
  ].filter(Boolean);

  return stats.join(', ') || 'Empty backup';
};

