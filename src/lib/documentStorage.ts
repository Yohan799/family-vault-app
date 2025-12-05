import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${user.id}/${categoryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Insert document record in database
    const { data, error } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
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
 * Get documents for a specific location
 */
export const getDocuments = async (
  categoryId: string,
  subcategoryId?: string,
  folderId?: string
): Promise<StoredDocument[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
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

    // Generate signed URLs for each document
    const documentsWithUrls: StoredDocument[] = await Promise.all(
      docs.map(async (doc) => {
        let path = doc.file_url as string;

        // Backward compatibility: if we stored a full URL earlier, extract the path
        if (path?.startsWith('http')) {
          const parts = path.split('/documents/');
          if (parts.length === 2) {
            path = parts[1];
          }
        }

        let signedUrl = '';
        if (path) {
          const { data: signed } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60 * 60); // 1 hour

          signedUrl = signed?.signedUrl || '';
        }

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
        } as StoredDocument;
      })
    );

    return documentsWithUrls;
  } catch (error) {
    console.error('Error retrieving documents:', error);
    return [];
  }
};

/**
 * Get all documents for a category
 */
export const getAllDocumentsInCategory = async (categoryId: string): Promise<StoredDocument[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', categoryId)
      .is('deleted_at', null);

    if (error) throw error;

    const docs = data || [];

    const documentsWithUrls: StoredDocument[] = await Promise.all(
      docs.map(async (doc) => {
        let path = doc.file_url as string;

        if (path?.startsWith('http')) {
          const parts = path.split('/documents/');
          if (parts.length === 2) {
            path = parts[1];
          }
        }

        let signedUrl = '';
        if (path) {
          const { data: signed } = await supabase.storage
            .from('documents')
            .createSignedUrl(path, 60 * 60);

          signedUrl = signed?.signedUrl || '';
        }

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
        } as StoredDocument;
      })
    );

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return { success: false, error: 'Authentication failed' };
    }
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Use security definer function for atomic cascade deletion
    const { data, error } = await supabase.rpc('soft_delete_document', {
      _document_id: documentId,
      _user_id: user.id
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

/**
 * Download document
 */
export const downloadDocument = async (doc: StoredDocument): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Increment download count
    await supabase
      .from('documents')
      .update({ download_count: doc.downloadCount + 1 })
      .eq('id', doc.id)
      .eq('user_id', user.id);

    // For native APK, use Capacitor Filesystem
    if (Capacitor.isNativePlatform()) {
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        // Fetch file as blob
        const response = await fetch(doc.fileUrl);
        if (!response.ok) throw new Error('Failed to fetch file');
        
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        
        // Save to Downloads directory
        const fileName = doc.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Documents,
        });
        
        console.log('[Download] File saved to Documents:', fileName);
        return;
      } catch (nativeError) {
        console.error('[Download] Native download failed:', nativeError);
        // Fall through to web download
      }
    }

    // Web download: Try blob download first
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
        return;
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
  } catch (error) {
    console.error('Error downloading document:', error);
    throw new Error('Failed to download document');
  }
};

/**
 * Convert blob to base64 string
 */
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Increment view count
 */
export const incrementViewCount = async (documentId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data } = await supabase
      .from('documents')
      .select('view_count')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (data) {
      await supabase
        .from('documents')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', documentId)
        .eq('user_id', user.id);
    }
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
