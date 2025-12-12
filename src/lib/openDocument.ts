import { Capacitor } from '@capacitor/core';

/**
 * Utility to handle document opening.
 * - Images & Videos: Return true to show in-app viewer
 * - PDFs, Docs, Spreadsheets: Open directly with native app, return false
 */

// File type detection helpers
export const isImageType = (type: string, name: string): boolean => {
    if (type?.startsWith('image/')) return true;
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.heic', '.heif'];
    return imageExts.some(ext => name?.toLowerCase().endsWith(ext));
};

export const isVideoType = (type: string, name: string): boolean => {
    if (type?.startsWith('video/')) return true;
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    return videoExts.some(ext => name?.toLowerCase().endsWith(ext));
};

export const isPdfType = (type: string, name: string): boolean => {
    if (type?.includes('pdf')) return true;
    return name?.toLowerCase().endsWith('.pdf');
};

export const isDocType = (type: string, name: string): boolean => {
    const lowerName = name?.toLowerCase() || '';
    if (type?.includes('msword') || type?.includes('wordprocessingml')) return true;
    return lowerName.endsWith('.doc') || lowerName.endsWith('.docx');
};

export const isSpreadsheetType = (type: string, name: string): boolean => {
    const lowerName = name?.toLowerCase() || '';
    if (type?.includes('ms-excel') || type?.includes('spreadsheetml')) return true;
    return lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx');
};

/**
 * Check if this file type should use the in-app viewer
 * Only images and videos use in-app viewer
 */
export const shouldUseInAppViewer = (type: string, name: string): boolean => {
    return isImageType(type, name) || isVideoType(type, name);
};

/**
 * Get MIME type from filename for native app opening
 */
export const getMimeType = (type: string, name: string): string => {
    if (type && type !== 'application/octet-stream') return type;

    const lowerName = name?.toLowerCase() || '';
    if (lowerName.endsWith('.pdf')) return 'application/pdf';
    if (lowerName.endsWith('.doc')) return 'application/msword';
    if (lowerName.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (lowerName.endsWith('.xls')) return 'application/vnd.ms-excel';
    if (lowerName.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
    if (lowerName.endsWith('.png')) return 'image/png';
    if (lowerName.endsWith('.gif')) return 'image/gif';
    if (lowerName.endsWith('.webp')) return 'image/webp';

    return 'application/octet-stream';
};

/**
 * Open document with native app (for PDFs, DOCs, etc.)
 * Returns true if opened successfully, false otherwise
 */
export const openWithNativeViewer = async (
    documentUrl: string,
    documentName: string,
    documentType: string
): Promise<boolean> => {
    // Only use native viewer on native platform
    if (!Capacitor.isNativePlatform()) {
        // On web, open in new tab
        window.open(documentUrl, '_blank');
        return true;
    }

    try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { FileOpener } = await import('@capacitor-community/file-opener');

        // Download file to device cache
        const response = await fetch(documentUrl);
        if (!response.ok) throw new Error('Failed to download file');

        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        // Create safe filename
        const safeFileName = documentName.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Write to cache directory
        const writeResult = await Filesystem.writeFile({
            path: safeFileName,
            data: base64,
            directory: Directory.Cache,
        });

        // Determine MIME type
        const mimeType = getMimeType(documentType, documentName);

        // Open with native app
        await FileOpener.open({
            filePath: writeResult.uri,
            contentType: mimeType,
        });

        return true;
    } catch (err) {
        console.error('Error opening with native viewer:', err);

        // Fallback to browser
        try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: documentUrl });
            return true;
        } catch (browserErr) {
            console.error('Browser fallback error:', browserErr);
            // Last resort: open in new tab
            window.open(documentUrl, '_blank');
            return true;
        }
    }
};
