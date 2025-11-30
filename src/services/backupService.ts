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

export const downloadBackup = async (filePath: string): Promise<string> => {
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
