import { supabase } from '@/integrations/supabase/client';

export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('profile-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

  if (uploadError) {
    throw uploadError;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profile-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  // Extract the file path from the URL
  const urlParts = imageUrl.split('/profile-images/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('profile-images')
    .remove([filePath]);

  if (error) {
    throw error;
  }
};
