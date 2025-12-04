import { Capacitor } from '@capacitor/core';

export interface ScannedDocument {
  file: File;
  dataUrl: string;
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
 * Native ML Kit document scanner with edge detection
 */
const scanWithMLKit = async (): Promise<ScannedDocument | null> => {
  try {
    console.log("[DocumentScanner] Loading ML Kit Document Scanner plugin...");
    const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');
    
    console.log("[DocumentScanner] Starting ML Kit scan...");
    const result = await DocumentScanner.scanDocument({
      pageLimit: 1,
      galleryImportAllowed: true,
      resultFormats: 'JPEG' // Single format string
    });

    console.log("[DocumentScanner] Full ML Kit result:", JSON.stringify(result, null, 2));

    // Handle ALL possible response formats from different plugin versions
    let imagePath: string | undefined;
    
    // Format 1: scannedImages array (most common in newer versions)
    if (result.scannedImages && result.scannedImages.length > 0) {
      imagePath = result.scannedImages[0];
      console.log("[DocumentScanner] Found image in scannedImages:", imagePath);
    }
    // Format 2: pages array (older versions)
    else if ((result as any).pages && (result as any).pages.length > 0) {
      imagePath = (result as any).pages[0];
      console.log("[DocumentScanner] Found image in pages:", imagePath);
    }
    // Format 3: scannedDocuments with jpeg property
    else if ((result as any).scannedDocuments?.[0]?.jpeg) {
      imagePath = (result as any).scannedDocuments[0].jpeg;
      console.log("[DocumentScanner] Found image in scannedDocuments:", imagePath);
    }

    if (!imagePath) {
      console.log("[DocumentScanner] No image path in any format - user likely cancelled");
      return null;
    }

    console.log("[DocumentScanner] Using image path:", imagePath);

    // Convert the file path to a File object
    const response = await fetch(imagePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch scanned image: ${response.status}`);
    }
    
    const blob = await response.blob();
    console.log("[DocumentScanner] Blob created:", { size: blob.size, type: blob.type });
    
    // Ensure we have a valid MIME type
    const mimeType = blob.type || 'image/jpeg';
    const fileName = `scan_${Date.now()}.jpg`;
    
    const file = new File([blob], fileName, { type: mimeType });
    console.log("[DocumentScanner] File created:", { name: file.name, size: file.size, type: file.type });
    
    // Create data URL for preview
    const dataUrl = await blobToDataUrl(blob);
    
    return { file, dataUrl };
  } catch (error) {
    console.error('[DocumentScanner] ML Kit scanner error:', error);
    
    // Check if user cancelled
    if (error instanceof Error && error.message.includes('cancel')) {
      console.log("[DocumentScanner] User cancelled ML Kit scan");
      return null;
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
