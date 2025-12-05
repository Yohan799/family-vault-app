import { Capacitor } from '@capacitor/core';

export interface ScannedDocument {
  file: File;
  dataUrl: string;
}

// ML Kit ScanResult type - handle all possible formats
interface MLKitScanResult {
  scannedImages?: string[];
  pages?: string[];
  scannedDocuments?: Array<{ jpeg?: string; pdf?: string }>;
  [key: string]: unknown; // Allow for other unknown properties
}

/**
 * Opens the ML Kit document scanner on native platforms
 * Falls back to camera capture on web
 */
export const scanDocument = async (): Promise<ScannedDocument | null> => {
  console.log("[DocumentScanner] Platform:", Capacitor.getPlatform(), "isNative:", Capacitor.isNativePlatform());
  
  if (Capacitor.isNativePlatform()) {
    return scanWithMLKit();
  } else {
    return scanWithCamera();
  }
};

/**
 * Native ML Kit document scanner with edge detection and timeout
 */
const scanWithMLKit = async (): Promise<ScannedDocument | null> => {
  try {
    const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');
    
    console.log('[DocumentScanner] Starting ML Kit scan...');
    
    // Set timeout for the entire scan operation
    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error('Scan timeout')), 60000);
    });
    
    const scanPromise = DocumentScanner.scanDocument({
      pageLimit: 1,
      galleryImportAllowed: true,
      resultFormats: 'JPEG'
    });
    
    const result = await Promise.race([scanPromise, timeoutPromise]);
    
    console.log('[DocumentScanner] Raw result type:', typeof result);
    console.log('[DocumentScanner] Raw result keys:', result ? Object.keys(result) : 'null');
    console.log('[DocumentScanner] Raw result:', JSON.stringify(result, null, 2));
    
    if (!result) {
      console.log('[DocumentScanner] No result returned - user cancelled');
      return null;
    }
    
    // Handle potentially wrapped result
    let actualResult = result as any;
    if (actualResult.result && typeof actualResult.result === 'object') {
      console.log('[DocumentScanner] Result is wrapped, unwrapping...');
      actualResult = actualResult.result;
    }
    
    // Try multiple possible response formats
    let imagePath: string | null = null;
    
    // Format 1: scannedImages array (most common)
    if (actualResult.scannedImages && Array.isArray(actualResult.scannedImages) && actualResult.scannedImages.length > 0) {
      imagePath = actualResult.scannedImages[0];
      console.log('[DocumentScanner] Found in scannedImages:', imagePath);
    }
    // Format 2: pages array
    else if (actualResult.pages && Array.isArray(actualResult.pages) && actualResult.pages.length > 0) {
      const page = actualResult.pages[0];
      imagePath = typeof page === 'string' ? page : page?.imageUri || page?.uri || page?.path;
      console.log('[DocumentScanner] Found in pages:', imagePath);
    }
    // Format 3: scannedDocuments array with jpeg property
    else if (actualResult.scannedDocuments && Array.isArray(actualResult.scannedDocuments) && actualResult.scannedDocuments.length > 0) {
      imagePath = actualResult.scannedDocuments[0]?.jpeg || actualResult.scannedDocuments[0]?.uri;
      console.log('[DocumentScanner] Found in scannedDocuments:', imagePath);
    }
    // Format 4: Direct properties
    else if (actualResult.jpeg) {
      imagePath = actualResult.jpeg;
      console.log('[DocumentScanner] Found jpeg property:', imagePath);
    }
    else if (actualResult.uri) {
      imagePath = actualResult.uri;
      console.log('[DocumentScanner] Found uri property:', imagePath);
    }
    // Format 5: Search for any string that looks like a file path
    else {
      console.log('[DocumentScanner] Searching for file path in result...');
      for (const key of Object.keys(actualResult)) {
        const value = actualResult[key];
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('/') || value.includes('.jpg') || value.includes('.jpeg'))) {
          imagePath = value;
          console.log(`[DocumentScanner] Found path in ${key}:`, imagePath);
          break;
        }
        if (Array.isArray(value) && value.length > 0) {
          const firstItem = value[0];
          if (typeof firstItem === 'string' && (firstItem.startsWith('file://') || firstItem.startsWith('/'))) {
            imagePath = firstItem;
            console.log(`[DocumentScanner] Found path in ${key}[0]:`, imagePath);
            break;
          }
        }
      }
    }
    
    if (!imagePath) {
      console.log('[DocumentScanner] No image path found in result, treating as cancellation');
      return null;
    }
    
    console.log('[DocumentScanner] Final image path:', imagePath);
    
    // Fetch the image with timeout
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 30000);
    
    try {
      const response = await fetch(imagePath, { signal: fetchController.signal });
      clearTimeout(fetchTimeout);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('[DocumentScanner] Blob size:', blob.size, 'type:', blob.type);
      
      // Determine MIME type
      let mimeType = blob.type;
      if (!mimeType || mimeType === 'application/octet-stream') {
        mimeType = imagePath.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
      }
      
      const fileName = `scan_${Date.now()}.${mimeType === 'image/png' ? 'png' : 'jpg'}`;
      const file = new File([blob], fileName, { type: mimeType });
      
      const dataUrl = await blobToDataUrl(blob);
      
      console.log('[DocumentScanner] Successfully created file:', fileName);
      return { file, dataUrl };
      
    } catch (fetchError: any) {
      clearTimeout(fetchTimeout);
      console.error('[DocumentScanner] Failed to fetch image:', fetchError);
      throw fetchError;
    }
    
  } catch (error: any) {
    console.error('[DocumentScanner] ML Kit error:', error);
    
    // If it's a timeout or critical error, fall back to camera
    if (error.message === 'Scan timeout' || error.name === 'AbortError') {
      console.log('[DocumentScanner] Timeout occurred, falling back to camera');
      return scanWithCamera();
    }
    
    // For other errors, also try camera fallback
    console.log('[DocumentScanner] Falling back to camera capture');
    return scanWithCamera();
  }
};

/**
 * Web fallback using camera capture
 */
const scanWithCamera = (): Promise<ScannedDocument | null> => {
  return new Promise((resolve) => {
    console.log("[DocumentScanner] Using camera/file input fallback");
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    let resolved = false;
    
    const cleanup = () => {
      input.remove();
    };
    
    input.onchange = async (e: Event) => {
      if (resolved) return;
      resolved = true;
      
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      console.log("[DocumentScanner] File selected:", file ? { name: file.name, size: file.size, type: file.type } : 'none');
      
      if (file) {
        try {
          // Ensure file has a valid type
          let processedFile = file;
          if (!file.type || file.type === '') {
            // Create new file with explicit MIME type based on extension
            const ext = file.name.split('.').pop()?.toLowerCase();
            const mimeMap: Record<string, string> = {
              'jpg': 'image/jpeg',
              'jpeg': 'image/jpeg',
              'png': 'image/png',
              'gif': 'image/gif',
              'webp': 'image/webp',
              'heic': 'image/heic',
              'heif': 'image/heif',
            };
            const mimeType = mimeMap[ext || ''] || 'image/jpeg';
            processedFile = new File([file], file.name, { type: mimeType });
            console.log("[DocumentScanner] Reprocessed file with MIME type:", processedFile.type);
          }
          
          const dataUrl = await blobToDataUrl(processedFile);
          cleanup();
          resolve({ file: processedFile, dataUrl });
        } catch (error) {
          console.error("[DocumentScanner] Error processing file:", error);
          cleanup();
          resolve(null);
        }
      } else {
        cleanup();
        resolve(null);
      }
    };
    
    // Handle cancel - use blur event as backup
    input.addEventListener('cancel', () => {
      if (resolved) return;
      resolved = true;
      console.log("[DocumentScanner] Camera input cancelled");
      cleanup();
      resolve(null);
    });
    
    // Timeout fallback for browsers that don't fire cancel event
    setTimeout(() => {
      if (!resolved && !input.files?.length) {
        // Don't resolve here - user might still be selecting
        console.log("[DocumentScanner] Timeout check - input still active");
      }
    }, 60000); // 60 second timeout
    
    input.click();
  });
};

/**
 * Convert blob to data URL
 */
const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
};
