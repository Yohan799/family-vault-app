import { Capacitor } from '@capacitor/core';

export interface ScannedDocument {
    file: File;
    dataUrl: string;
}

/**
 * Document Scanner using web camera capture
 * For Capacitor 6.x compatibility - uses HTML5 camera input
 */
export const scanDocument = async (): Promise<ScannedDocument | null> => {
    console.log("[Scanner] Starting scan, platform:", Capacitor.getPlatform());
    return scanWithWebCamera();
};

/**
 * Web/Native fallback using file input with camera
 */
const scanWithWebCamera = (): Promise<ScannedDocument | null> => {
    return new Promise((resolve) => {
        console.log("[Scanner] Using web file input with camera...");

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
