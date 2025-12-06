import { Capacitor } from '@capacitor/core';

export interface ScannedDocument {
  file: File;
  dataUrl: string;
}

/**
 * Opens document scanner
 * Uses ML Kit on native, HTML5 input on web
 */
export const scanDocument = async (): Promise<ScannedDocument | null> => {
  // Use ML Kit scanner on native platforms
  if (Capacitor.isNativePlatform()) {
    console.log("[DocumentScanner] Using ML Kit document scanner");
    return scanWithMLKit();
  }

  // Fallback to camera capture on web
  console.log("[DocumentScanner] Using camera capture (web)");
  return scanWithCamera();
};

/**
 * ML Kit Document Scanner for native platforms
 */
const scanWithMLKit = async (): Promise<ScannedDocument | null> => {
  try {
    const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');

    console.log("[DocumentScanner] Starting ML Kit scanner...");

    const result = await DocumentScanner.scanDocument({
      pageLimit: 1, // Scan single page
    });

    console.log("[DocumentScanner] ML Kit result:", result);

    if (result.scannedImages && result.scannedImages.length > 0) {
      const imageUri = result.scannedImages[0];
      console.log("[DocumentScanner] Scanned image URI:", imageUri);

      try {
        // Use Capacitor Filesystem to read the file
        const { Filesystem } = await import('@capacitor/filesystem');

        // Read file as base64
        const fileData = await Filesystem.readFile({
          path: imageUri,
        });

        console.log("[DocumentScanner] File read successfully");

        // Convert base64 to blob
        const base64Data = fileData.data as string;
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });

        // Create a File object
        const fileName = `scan_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        // Convert to data URL
        const dataUrl = await blobToDataUrl(blob);

        console.log("[DocumentScanner] ML Kit scan complete:", { fileName, size: file.size });
        return { file, dataUrl };
      } catch (fsError) {
        console.error("[DocumentScanner] Filesystem read failed:", fsError);

        // Fallback: try fetch (works for some URI formats)
        try {
          const response = await fetch(imageUri);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = `scan_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: 'image/jpeg' });
            const dataUrl = await blobToDataUrl(blob);
            console.log("[DocumentScanner] Fetch fallback worked");
            return { file, dataUrl };
          }
        } catch (fetchError) {
          console.error("[DocumentScanner] Fetch fallback also failed:", fetchError);
        }

        throw new Error("Unable to read scanned image");
      }
    }

    console.log("[DocumentScanner] No images scanned");
    return null;
  } catch (error: any) {
    console.error("[DocumentScanner] ML Kit error:", error);

    // If user cancelled, return null
    if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
      console.log("[DocumentScanner] User cancelled scanning");
      return null;
    }

    // For other errors, fall back to camera
    console.log("[DocumentScanner] Falling back to camera capture");
    return scanWithCamera();
  }
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
