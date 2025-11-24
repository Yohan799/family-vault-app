import { supabase } from "@/integrations/supabase/client";

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
 * Delete document from Supabase (hard delete)
 */
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  try {
    // First, get the document to find the file path
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage bucket
    if (doc?.file_url) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.file_url]);

      if (storageError) {
        console.warn('Storage deletion failed:', storageError);
        // Continue with database deletion even if storage fails
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

/**
 * Download document
 */
export const downloadDocument = async (doc: StoredDocument): Promise<void> => {
  try {
    // Increment download count
    await supabase
      .from('documents')
      .update({ download_count: doc.downloadCount + 1 })
      .eq('id', doc.id);

    // Try blob download first (works locally), fallback to direct link (for CORS issues)
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
 * Increment view count
 */
export const incrementViewCount = async (documentId: string): Promise<void> => {
  try {
    const { data } = await supabase
      .from('documents')
      .select('view_count')
      .eq('id', documentId)
      .single();

    if (data) {
      await supabase
        .from('documents')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', documentId);
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
