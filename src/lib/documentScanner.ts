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
  // Create a timeout promise
  const timeoutPromise = new Promise<null>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Document scan timed out after 60 seconds'));
    }, 60000); // 60 second timeout
  });

  try {
    console.log("[DocumentScanner] Loading ML Kit Document Scanner plugin...");
    const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');
    
    console.log("[DocumentScanner] Starting ML Kit scan...");
    
    // Race between scan and timeout
    const scanPromise = DocumentScanner.scanDocument({
      pageLimit: 1,
      galleryImportAllowed: true,
      resultFormats: 'JPEG' // Single format string as required by plugin
    });

    const result = await Promise.race([scanPromise, timeoutPromise]) as MLKitScanResult | null;
    
    console.log("[DocumentScanner] Raw ML Kit result:", result);
    
    if (!result) {
      console.log("[DocumentScanner] Scan returned null/undefined result - user likely cancelled");
      return null;
    }

    console.log("[DocumentScanner] Full ML Kit result keys:", Object.keys(result));
    console.log("[DocumentScanner] Full ML Kit result:", JSON.stringify(result, null, 2));

    // Handle ALL possible response formats from different plugin versions
    let imagePath: string | undefined;
    
    // Format 1: scannedImages array (most common in newer versions)
    if (result.scannedImages && Array.isArray(result.scannedImages) && result.scannedImages.length > 0) {
      imagePath = result.scannedImages[0];
      console.log("[DocumentScanner] Found image in scannedImages:", imagePath);
    }
    // Format 2: pages array (older versions)
    else if (result.pages && Array.isArray(result.pages) && result.pages.length > 0) {
      imagePath = result.pages[0];
      console.log("[DocumentScanner] Found image in pages:", imagePath);
    }
    // Format 3: scannedDocuments with jpeg property
    else if (result.scannedDocuments && Array.isArray(result.scannedDocuments) && result.scannedDocuments.length > 0) {
      const doc = result.scannedDocuments[0];
      imagePath = doc?.jpeg || doc?.pdf;
      console.log("[DocumentScanner] Found image in scannedDocuments:", imagePath);
    }
    // Format 4: Check for any string property that looks like a path
    else {
      for (const [key, value] of Object.entries(result)) {
        if (typeof value === 'string' && (value.startsWith('file://') || value.startsWith('/') || value.startsWith('content://'))) {
          imagePath = value;
          console.log(`[DocumentScanner] Found image path in property '${key}':`, imagePath);
          break;
        }
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
          imagePath = value[0];
          console.log(`[DocumentScanner] Found image path in array property '${key}':`, imagePath);
          break;
        }
      }
    }

    if (!imagePath) {
      console.log("[DocumentScanner] No image path found in any format - user likely cancelled or scan failed");
      console.log("[DocumentScanner] Result structure:", JSON.stringify(result, null, 2));
      return null;
    }

    console.log("[DocumentScanner] Using image path:", imagePath);

    // Convert the file path to a File object with timeout
    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 30000); // 30 second fetch timeout

    try {
      console.log("[DocumentScanner] Fetching image from path...");
      const response = await fetch(imagePath, { signal: fetchController.signal });
      clearTimeout(fetchTimeout);
      
      if (!response.ok) {
        console.error("[DocumentScanner] Fetch failed:", response.status, response.statusText);
        throw new Error(`Failed to fetch scanned image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log("[DocumentScanner] Blob created:", { size: blob.size, type: blob.type });
      
      if (blob.size === 0) {
        console.error("[DocumentScanner] Blob is empty");
        throw new Error('Scanned image is empty');
      }
      
      // Ensure we have a valid MIME type
      const mimeType = blob.type || 'image/jpeg';
      const fileName = `scan_${Date.now()}.jpg`;
      
      const file = new File([blob], fileName, { type: mimeType });
      console.log("[DocumentScanner] File created:", { name: file.name, size: file.size, type: file.type });
      
      // Create data URL for preview
      const dataUrl = await blobToDataUrl(blob);
      
      console.log("[DocumentScanner] Scan complete, returning result");
      return { file, dataUrl };
    } catch (fetchError) {
      clearTimeout(fetchTimeout);
      console.error("[DocumentScanner] Fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error('[DocumentScanner] ML Kit scanner error:', error);
    
    // Check if user cancelled
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('cancel') || errorMessage.includes('dismissed') || errorMessage.includes('closed')) {
        console.log("[DocumentScanner] User cancelled ML Kit scan");
        return null;
      }
      if (errorMessage.includes('timed out')) {
        console.log("[DocumentScanner] Scan timed out, falling back to camera");
        return scanWithCamera();
      }
      if (error.name === 'AbortError') {
        console.log("[DocumentScanner] Fetch aborted, falling back to camera");
        return scanWithCamera();
      }
    }
    
    // Fall back to camera if ML Kit fails
    console.log("[DocumentScanner] Falling back to camera capture...");
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
