// Document Storage Utility for localStorage
// This will be migrated to Supabase in production

export interface StoredDocument {
    id: string;
    name: string;
    size: number;
    type: string;
    date: string;
    categoryId: string;
    subcategoryId: string;
    folderId?: string;
    base64Data: string;
}

/**
 * Convert File to base64 string
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64String = reader.result as string;
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

/**
 * Store document in localStorage
 */
export const storeDocument = async (
    file: File,
    categoryId: string,
    subcategoryId: string,
    folderId?: string
): Promise<StoredDocument> => {
    try {
        // Convert file to base64
        const base64Data = await convertFileToBase64(file);

        // Create document metadata
        const document: StoredDocument = {
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            date: new Date().toISOString(),
            categoryId,
            subcategoryId,
            folderId,
            base64Data,
        };

        // Get existing documents
        const storageKey = folderId
            ? `documents_${categoryId}_${subcategoryId}_${folderId}`
            : `documents_${categoryId}_${subcategoryId}`;

        const existingDocs = getDocuments(categoryId, subcategoryId, folderId);

        // Add new document
        const updatedDocs = [...existingDocs, document];

        // Save to localStorage
        localStorage.setItem(storageKey, JSON.stringify(updatedDocs));

        // Update document counts
        updateDocumentCounts(categoryId, subcategoryId, folderId);

        return document;
    } catch (error) {
        console.error('Error storing document:', error);
        throw new Error('Failed to store document');
    }
};

/**
 * Get documents for a specific location
 */
export const getDocuments = (
    categoryId: string,
    subcategoryId: string,
    folderId?: string
): StoredDocument[] => {
    try {
        const storageKey = folderId
            ? `documents_${categoryId}_${subcategoryId}_${folderId}`
            : `documents_${categoryId}_${subcategoryId}`;

        const stored = localStorage.getItem(storageKey);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error retrieving documents:', error);
        return [];
    }
};

/**
 * Get all documents for a subcategory (including nested folders)
 */
export const getAllDocumentsInSubcategory = (
    categoryId: string,
    subcategoryId: string
): StoredDocument[] => {
    try {
        const allDocs: StoredDocument[] = [];

        // Get documents in subcategory root
        allDocs.push(...getDocuments(categoryId, subcategoryId));

        // Get documents in nested folders
        const folderKeys = Object.keys(localStorage).filter(key =>
            key.startsWith(`documents_${categoryId}_${subcategoryId}_`) &&
            key !== `documents_${categoryId}_${subcategoryId}`
        );

        folderKeys.forEach(key => {
            const stored = localStorage.getItem(key);
            if (stored) {
                allDocs.push(...JSON.parse(stored));
            }
        });

        return allDocs;
    } catch (error) {
        console.error('Error retrieving all documents:', error);
        return [];
    }
};

/**
 * Delete document from localStorage
 */
export const deleteDocument = (
    documentId: string,
    categoryId: string,
    subcategoryId: string,
    folderId?: string
): boolean => {
    try {
        const storageKey = folderId
            ? `documents_${categoryId}_${subcategoryId}_${folderId}`
            : `documents_${categoryId}_${subcategoryId}`;

        const existingDocs = getDocuments(categoryId, subcategoryId, folderId);
        const updatedDocs = existingDocs.filter(doc => doc.id !== documentId);

        localStorage.setItem(storageKey, JSON.stringify(updatedDocs));
        updateDocumentCounts(categoryId, subcategoryId, folderId);

        return true;
    } catch (error) {
        console.error('Error deleting document:', error);
        return false;
    }
};

/**
 * Download document (convert base64 back to file)
 */
export const downloadDocument = (doc: StoredDocument): void => {
    try {
        // Create a link element
        const link = window.document.createElement('a');
        link.href = doc.base64Data;
        link.download = doc.name;

        // Trigger download
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    } catch (error) {
        console.error('Error downloading document:', error);
        throw new Error('Failed to download document');
    }
};

/**
 * Update document counts in category data
 */
export const updateDocumentCounts = (
    categoryId: string,
    subcategoryId: string,
    folderId?: string
): void => {
    try {
        if (folderId) {
            // Update nested folder count
            const folderKey = `nested_folders_${subcategoryId}`;
            const folders = localStorage.getItem(folderKey);

            if (folders) {
                const parsedFolders = JSON.parse(folders);
                const updatedFolders = parsedFolders.map((folder: any) => {
                    if (folder.id === folderId) {
                        const docs = getDocuments(categoryId, subcategoryId, folderId);
                        return { ...folder, documentCount: docs.length };
                    }
                    return folder;
                });
                localStorage.setItem(folderKey, JSON.stringify(updatedFolders));
            }
        }

        // Update subcategory count
        const totalDocs = getAllDocumentsInSubcategory(categoryId, subcategoryId);

        // Update in custom subcategories if exists
        const customSubsKey = `custom_subcategories_${categoryId}`;
        const customSubs = localStorage.getItem(customSubsKey);

        if (customSubs) {
            const parsed = JSON.parse(customSubs);
            const updated = parsed.map((sub: any) => {
                if (sub.id === subcategoryId) {
                    return { ...sub, documentCount: totalDocs.length };
                }
                return sub;
            });
            localStorage.setItem(customSubsKey, JSON.stringify(updated));
        }
    } catch (error) {
        console.error('Error updating document counts:', error);
    }
};

/**
 * Get storage usage information
 */
export const getStorageInfo = (): { used: number; total: number; percentage: number } => {
    try {
        let used = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                used += localStorage[key].length + key.length;
            }
        }

        // localStorage limit is typically 5-10MB (5MB = 5242880 bytes)
        const total = 5242880;
        const percentage = (used / total) * 100;

        return { used, total, percentage };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return { used: 0, total: 5242880, percentage: 0 };
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
