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
    const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');
    
    // Use type assertion for flexibility with different plugin versions
    const result = await DocumentScanner.scanDocument({
      pageLimit: 1,
      galleryImportAllowed: true,
      resultFormats: 'JPEG'
    }) as { pages?: string[]; scannedDocuments?: Array<{ jpeg?: string }> };

    // Handle different response formats
    const imagePath = result.pages?.[0] || result.scannedDocuments?.[0]?.jpeg;

    if (imagePath) {
      // Convert the file path to a File object
      const response = await fetch(imagePath);
      const blob = await response.blob();
      const file = new File([blob], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Create data URL for preview
      const dataUrl = await blobToDataUrl(blob);
      
      return { file, dataUrl };
    }
    
    return null;
  } catch (error) {
    console.error('ML Kit scanner error:', error);
    // Fall back to camera if ML Kit fails
    return scanWithCamera();
  }
};

/**
 * Web fallback using camera capture
 */
const scanWithCamera = (): Promise<ScannedDocument | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      
      if (file) {
        const dataUrl = await blobToDataUrl(file);
        resolve({ file, dataUrl });
      } else {
        resolve(null);
      }
    };
    
    // Handle cancel
    input.addEventListener('cancel', () => resolve(null));
    
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
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
