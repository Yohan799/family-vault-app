import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from '@capacitor/core';

export interface StoredDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  date: string;
  categoryId: string;
  subcategoryId?: string;
  folderId?: string;
  fileUrl: string;
  viewCount: number;
  downloadCount: number;
  externalSource?: string;
}

// Cache for user ID to avoid repeated auth calls
let cachedUserId: string | null = null;
let userIdCacheTime = 0;
const USER_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedUserId = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedUserId && now - userIdCacheTime < USER_ID_CACHE_DURATION) {
    return cachedUserId;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    cachedUserId = user.id;
    userIdCacheTime = now;
  }
  return user?.id || null;
};

// Helper to extract path from URL or return path as-is
const extractPath = (fileUrl: string): string => {
  if (fileUrl?.startsWith('http')) {
    const parts = fileUrl.split('/documents/');
    if (parts.length === 2) {
      return parts[1];
    }
  }
  return fileUrl;
};

/**
 * Store document in Supabase Storage and Database
 */
export const storeDocument = async (
  file: File,
  categoryId: string,
  subcategoryId?: string,
  folderId?: string,
  externalSource?: string
): Promise<StoredDocument> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) throw new Error("User not authenticated");

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${categoryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Insert document record in database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        folder_id: folderId,
        file_name: file.name,
        file_url: filePath,
        file_size: file.size,
        file_type: file.type,
        external_source: externalSource,
        view_count: 0,
        download_count: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.file_name,
      size: data.file_size || 0,
      type: data.file_type || '',
      date: data.uploaded_at,
      categoryId: data.category_id || '',
      subcategoryId: data.subcategory_id || undefined,
      folderId: data.folder_id || undefined,
      fileUrl: data.file_url,
      viewCount: data.view_count || 0,
      downloadCount: data.download_count || 0,
      externalSource: data.external_source || undefined,
    };
  } catch (error) {
    console.error('Error storing document:', error);
    throw new Error('Failed to store document');
  }
};

/**
 * Get documents for a specific location - OPTIMIZED with batch signed URL generation
 */
export const getDocuments = async (
  categoryId: string,
  subcategoryId?: string,
  folderId?: string
): Promise<StoredDocument[]> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) return [];

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (folderId) {
      query = query.eq('folder_id', folderId);
    } else if (subcategoryId) {
      query = query.eq('subcategory_id', subcategoryId).is('folder_id', null);
    } else {
      query = query.is('subcategory_id', null).is('folder_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    const docs = data || [];
    if (docs.length === 0) return [];

    // Extract all paths for batch URL generation
    const paths = docs.map(doc => extractPath(doc.file_url as string)).filter(Boolean);

    // Generate signed URLs in BATCH (single API call instead of N calls)
    let signedUrlMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('documents')
        .createSignedUrls(paths, 60 * 60); // 1 hour

      if (signedUrls) {
        signedUrls.forEach((item, index) => {
          if (item.signedUrl) {
            signedUrlMap.set(paths[index], item.signedUrl);
          }
        });
      }
    }

    // Map documents with signed URLs from the batch result
    const documentsWithUrls: StoredDocument[] = docs.map((doc) => {
      const path = extractPath(doc.file_url as string);
      const signedUrl = signedUrlMap.get(path) || '';

      return {
        id: doc.id,
        name: doc.file_name,
        size: doc.file_size || 0,
        type: doc.file_type || '',
        date: doc.uploaded_at,
        categoryId: doc.category_id || '',
        subcategoryId: doc.subcategory_id || undefined,
        folderId: doc.folder_id || undefined,
        fileUrl: signedUrl,
        viewCount: doc.view_count || 0,
        downloadCount: doc.download_count || 0,
        externalSource: doc.external_source || undefined,
      };
    });

    return documentsWithUrls;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
};

/**
 * Get all documents for a category - OPTIMIZED with batch signed URL generation
 */
export const getAllDocumentsInCategory = async (categoryId: string): Promise<StoredDocument[]> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (error) throw error;

    const docs = data || [];
    if (docs.length === 0) return [];

    // Extract all paths for batch URL generation
    const paths = docs.map(doc => extractPath(doc.file_url as string)).filter(Boolean);

    // Generate signed URLs in BATCH
    let signedUrlMap = new Map<string, string>();
    if (paths.length > 0) {
      const { data: signedUrls } = await supabase.storage
        .from('documents')
        .createSignedUrls(paths, 60 * 60);

      if (signedUrls) {
        signedUrls.forEach((item, index) => {
          if (item.signedUrl) {
            signedUrlMap.set(paths[index], item.signedUrl);
          }
        });
      }
    }

    const documentsWithUrls: StoredDocument[] = docs.map((doc) => {
      const path = extractPath(doc.file_url as string);
      const signedUrl = signedUrlMap.get(path) || '';

      return {
        id: doc.id,
        name: doc.file_name,
        size: doc.file_size || 0,
        type: doc.file_type || '',
        date: doc.uploaded_at,
        categoryId: doc.category_id || '',
        subcategoryId: doc.subcategory_id || undefined,
        folderId: doc.folder_id || undefined,
        fileUrl: signedUrl,
        viewCount: doc.view_count || 0,
        downloadCount: doc.download_count || 0,
        externalSource: doc.external_source || undefined,
      };
    });

    return documentsWithUrls;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
};

/**
 * Delete document from Supabase (soft delete)
 */
export const deleteDocument = async (documentId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use security definer function for atomic cascade deletion
    const { data, error } = await supabase.rpc('soft_delete_document', {
      _document_id: documentId,
      _user_id: userId
    });

    if (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Document not found or access denied' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Unexpected error occurred' };
  }
};

export interface DownloadResult {
  success: boolean;
  path?: string;
}

/**
 * Download document
 */
export const downloadDocument = async (doc: StoredDocument): Promise<DownloadResult> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) throw new Error("User not authenticated");

    // Increment download count (fire and forget - don't block)
    supabase
      .from('documents')
      .update({ download_count: doc.downloadCount + 1 })
      .eq('id', doc.id)
      .eq('user_id', userId)
      .then(() => {});

    // Native APK download - use Filesystem plugin
    if (Capacitor.isNativePlatform()) {
      console.log('[Download] Using Capacitor Filesystem plugin');
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');

        // Fetch the file as blob
        const response = await fetch(doc.fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file');

        const blob = await response.blob();

        // Convert blob to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            // Remove the data:mime;base64, prefix
            const base64Data = result.split(',')[1];
            resolve(base64Data);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });

        // Save to Downloads directory
        const fileName = doc.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const result = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents,
        });

        const savedPath = `/storage/emulated/0/Documents/${fileName}`;
        console.log('[Download] File saved to:', savedPath);

        // Return the path for toast display
        return { success: true, path: savedPath };
      } catch (fsError) {
        console.warn('[Download] Filesystem plugin failed, falling back to browser:', fsError);
        window.open(doc.fileUrl, '_blank');
        return { success: true, path: 'Opened in browser' };
      }
    }

    // Web download - try blob first, fallback to direct link
    try {
      const response = await fetch(doc.fileUrl, {
        mode: 'cors',
        credentials: 'omit'
      });

      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = doc.name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        return { success: true, path: 'Downloaded to Downloads folder' };
      }
    } catch (fetchError) {
      console.warn('Blob download failed, using direct link:', fetchError);
    }

    // Fallback: Open in new tab with download attribute  
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    return { success: true, path: 'Opened in browser' };
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
};

/**
 * Increment view count - fire and forget (non-blocking)
 */
export const incrementViewCount = async (documentId: string): Promise<void> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) return;

    // Fire and forget - don't block UI
    supabase
      .from('documents')
      .select('view_count')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()
      .then(({ data }) => {
        if (data) {
          supabase
            .from('documents')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('id', documentId)
            .eq('user_id', userId)
            .then(() => {});
        }
      });
  } catch (error) {
    console.error('Error incrementing view count:', error);
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Rename document
 */
export const renameDocument = async (
  documentId: string,
  newName: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userId = await getCachedUserId();
    if (!userId) return { success: false, error: 'User not authenticated' };

    if (!newName || newName.trim() === '') {
      return { success: false, error: 'File name cannot be empty' };
    }

    const { error } = await supabase
      .from('documents')
      .update({
        file_name: newName.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error renaming document:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error renaming document:', error);
    return { success: false, error: error.message || 'Unexpected error occurred' };
  }
};
