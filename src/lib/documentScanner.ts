import { Capacitor } from '@capacitor/core';

export interface ScannedDocument {
    file: File;
    dataUrl: string;
}

/**
 * Document Scanner using @capgo/capacitor-document-scanner
 * Features: Edge detection, perspective correction, returns base64 directly
 * Works like CamScanner - detect document edges and crop automatically
 */
export const scanDocument = async (): Promise<ScannedDocument | null> => {
    console.log("[Scanner] Starting scan, platform:", Capacitor.getPlatform());

    if (Capacitor.isNativePlatform()) {
        return scanWithCapgoScanner();
    } else {
        return scanWithWebCamera();
    }
};

/**
 * Use Capgo Document Scanner - has edge detection and returns base64
 */
const scanWithCapgoScanner = async (): Promise<ScannedDocument | null> => {
    try {
        console.log("[Scanner] Loading Capgo Document Scanner...");
        const { DocumentScanner, ResponseType } = await import('@capgo/capacitor-document-scanner');

        console.log("[Scanner] Starting document scan with edge detection...");

        // Scan document with edge detection and auto-crop
        const result = await DocumentScanner.scanDocument({
            letUserAdjustCrop: true,     // Allow user to adjust crop corners
            maxNumDocuments: 1,          // Single document
            responseType: ResponseType.Base64,  // Return as base64
        });

        console.log("[Scanner] Scan result:", result ? "Got result" : "No result");

        if (!result || !result.scannedImages || result.scannedImages.length === 0) {
            console.log("[Scanner] User cancelled or no images");
            return null;
        }

        // Get base64 image data
        const base64Data = result.scannedImages[0];
        console.log("[Scanner] Got base64 data, length:", base64Data?.length);

        if (!base64Data) {
            console.log("[Scanner] No base64 data in result");
            return null;
        }

        // Create data URL
        const dataUrl = base64Data.startsWith('data:')
            ? base64Data
            : `data:image/jpeg;base64,${base64Data}`;

        // Convert base64 to File
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const fileName = `scan_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });

        console.log("[Scanner] File created:", file.name, file.size, "bytes");

        return { file, dataUrl };

    } catch (error: any) {
        console.error("[Scanner] Capgo scanner error:", error);

        // User cancelled
        if (error?.message?.toLowerCase().includes('cancel')) {
            return null;
        }

        // Try fallback to ML Kit
        console.log("[Scanner] Trying ML Kit fallback...");
        return scanWithMLKitFallback();
    }
};

/**
 * ML Kit fallback - in case Capgo doesn't work
 */
const scanWithMLKitFallback = async (): Promise<ScannedDocument | null> => {
    try {
        console.log("[Scanner] Loading ML Kit Document Scanner...");
        const { DocumentScanner } = await import('@capacitor-mlkit/document-scanner');

        const result = await DocumentScanner.scanDocument({
            pageLimit: 1,
            galleryImportAllowed: true,
            resultFormats: 'JPEG'
        }) as any;

        console.log("[Scanner] ML Kit result:", result);

        if (!result) return null;

        // Try to extract image path
        let imagePath: string | undefined;

        if (result.scannedImages?.length) {
            imagePath = result.scannedImages[0];
        } else if (result.pages?.length) {
            imagePath = result.pages[0];
        }

        if (!imagePath) return null;

        console.log("[Scanner] ML Kit image path:", imagePath);

        // Try to read with XMLHttpRequest
        const fileData = await readFileWithXHR(imagePath);
        if (!fileData) {
            // Try with fetch as last resort
            console.log("[Scanner] XHR failed, trying fetch...");
            return scanWithWebCamera();
        }

        const blob = new Blob([fileData], { type: 'image/jpeg' });
        const fileName = `scan_${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        const dataUrl = await blobToDataUrl(blob);

        return { file, dataUrl };

    } catch (error) {
        console.error("[Scanner] ML Kit fallback error:", error);
        return scanWithWebCamera();
    }
};

/**
 * Read file with XMLHttpRequest - works for file:// URIs
 */
const readFileWithXHR = (path: string): Promise<ArrayBuffer | null> => {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', path, true);
        xhr.responseType = 'arraybuffer';
        xhr.timeout = 10000;

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 0) {
                resolve(xhr.response);
            } else {
                resolve(null);
            }
        };

        xhr.onerror = () => resolve(null);
        xhr.ontimeout = () => resolve(null);
        xhr.send();
    });
};

/**
 * Web fallback using file input with camera
 */
const scanWithWebCamera = (): Promise<ScannedDocument | null> => {
    return new Promise((resolve) => {
        console.log("[Scanner] Using web file input...");

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';

        let resolved = false;

        input.onchange = async (e: Event) => {
            if (resolved) return;
            resolved = true;

            const file = (e.target as HTMLInputElement).files?.[0];

            if (file) {
                console.log("[Scanner] File selected:", file.name);

                let processedFile = file;
                if (!file.type) {
                    processedFile = new File([file], file.name, { type: 'image/jpeg' });
                }

                const dataUrl = await blobToDataUrl(processedFile);
                input.remove();
                resolve({ file: processedFile, dataUrl });
            } else {
                input.remove();
                resolve(null);
            }
        };

        input.addEventListener('cancel', () => {
            if (!resolved) {
                resolved = true;
                input.remove();
                resolve(null);
            }
        });

        input.click();
    });
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(blob);
    });
};
