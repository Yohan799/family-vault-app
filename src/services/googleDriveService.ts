import { supabase } from '@/integrations/supabase/client';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
  size?: string;
}

export interface ListFilesResponse {
  files: GoogleDriveFile[];
  nextPageToken?: string;
}

// Check if user has Google identity linked
export const hasGoogleLinked = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    // Check if user has a Google identity
    const identities = user.identities || [];
    return identities.some(identity => identity.provider === 'google');
  } catch (error) {
    console.error('[GoogleDrive] Error checking Google identity:', error);
    return false;
  }
};

// Get the Google access token from session
export const getGoogleAccessToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.provider_token) {
      console.log('[GoogleDrive] No provider token in session');
      return null;
    }
    return session.provider_token;
  } catch (error) {
    console.error('[GoogleDrive] Error getting access token:', error);
    return null;
  }
};

// Link Google account to existing user (for email/password users)
export const linkGoogleAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        scopes: 'https://www.googleapis.com/auth/drive.readonly',
      }
    });

    if (error) {
      console.error('[GoogleDrive] Link error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('[GoogleDrive] Link error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to link Google account' 
    };
  }
};

// List files in a folder
export const listFiles = async (
  accessToken: string, 
  folderId?: string, 
  pageToken?: string
): Promise<ListFilesResponse> => {
  const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
    body: {
      action: 'list',
      accessToken,
      folderId,
      pageToken,
    }
  });

  if (error) {
    console.error('[GoogleDrive] List files error:', error);
    throw new Error(error.message || 'Failed to list files');
  }

  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
};

// Search files
export const searchFiles = async (
  accessToken: string, 
  query: string, 
  pageToken?: string
): Promise<ListFilesResponse> => {
  const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
    body: {
      action: 'search',
      accessToken,
      query,
      pageToken,
    }
  });

  if (error) {
    console.error('[GoogleDrive] Search files error:', error);
    throw new Error(error.message || 'Failed to search files');
  }

  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
};

// Download a file and return as Blob
export const downloadFile = async (
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<Blob> => {
  const { data, error } = await supabase.functions.invoke('google-drive-proxy', {
    body: {
      action: 'download',
      accessToken,
      fileId,
      mimeType,
    }
  });

  if (error) {
    console.error('[GoogleDrive] Download error:', error);
    throw new Error(error.message || 'Failed to download file');
  }

  // Convert base64 to Blob
  const base64 = data.data;
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: data.mimeType });
};

// Helper to check if file is a folder
export const isFolder = (file: GoogleDriveFile): boolean => {
  return file.mimeType === 'application/vnd.google-apps.folder';
};

// Helper to get file icon based on mime type
export const getFileIcon = (mimeType: string): string => {
  if (mimeType === 'application/vnd.google-apps.folder') return '📁';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.includes('document') || mimeType.includes('word')) return '📝';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📽️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  return '📎';
};
