export interface ScannedDocument {
  file: File;
  dataUrl: string;
}

/**
 * Opens camera for document capture
 * Uses HTML5 input which works in both web and Capacitor WebView
 */
export const scanDocument = async (): Promise<ScannedDocument | null> => {
  console.log("[DocumentScanner] Using camera capture");
  return scanWithCamera();
};

/**
 * Camera capture using HTML5 input
 * Works on both web and native APK (Capacitor WebView)
 */
const scanWithCamera = (): Promise<ScannedDocument | null> => {
  return new Promise((resolve) => {
    console.log("[DocumentScanner] Opening camera/file input");
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Back camera for documents
    
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
    
    input.addEventListener('cancel', () => {
      if (resolved) return;
      resolved = true;
      console.log("[DocumentScanner] Camera input cancelled");
      cleanup();
      resolve(null);
    });
    
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
