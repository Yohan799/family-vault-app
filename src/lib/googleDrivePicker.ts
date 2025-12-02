// Google Drive Picker Integration
// Uses native file picker on Android, web-based GIS picker on web

import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let pickerApiLoaded = false;
let tokenClient: any = null;
let accessToken: string | null = null;
let tokenExpiry: number = 0;
let currentResolve: ((token: string) => void) | null = null;
let currentReject: ((error: Error) => void) | null = null;

// These are public keys that can be stored in code
const GOOGLE_API_KEY = 'AIzaSyC33PFiW54pUdt_oIUYVLweVX6KOaiHxdw';
const CLIENT_ID = '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  downloadUrl?: string;
  blob?: Blob; // For native picker, blob is already available
}

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// ==================== NATIVE FILE PICKER ====================

const openNativeFilePicker = async (): Promise<GoogleDriveFile | null> => {
  try {
    console.log('[Native Picker] Opening native file picker...');
    
    const { FilePicker } = await import('@capawesome/capacitor-file-picker');
    
    const result = await FilePicker.pickFiles({
      readData: true, // Get file contents as base64
    });

    if (result.files && result.files.length > 0) {
      const file = result.files[0];
      console.log('[Native Picker] File selected:', file.name);
      
      // Convert base64 data to Blob
      const blob = file.data ? base64ToBlob(file.data, file.mimeType || 'application/octet-stream') : undefined;
      
      return {
        id: file.name || 'native-file',
        name: file.name || 'Unknown File',
        mimeType: file.mimeType || 'application/octet-stream',
        url: file.path || '',
        blob: blob,
      };
    }
    
    console.log('[Native Picker] No file selected');
    return null;
  } catch (error: any) {
    console.error('[Native Picker] Error:', error);
    
    // User cancelled selection
    if (error.message?.includes('canceled') || error.message?.includes('cancelled')) {
      return null;
    }
    
    throw new Error('Failed to open file picker. Please try again.');
  }
};

// ==================== WEB GIS PICKER ====================

// Load Google Identity Services (GIS) script
const loadGISScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      console.log('[Google Drive] GIS script loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('[Google Drive] Failed to load GIS script');
      reject(new Error('Failed to load Google Identity Services'));
    };
    document.body.appendChild(script);
  });
};

// Load Google API (GAPI) script
const loadGAPIScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      console.log('[Google Drive] GAPI script loaded');
      resolve();
    };
    script.onerror = () => {
      console.error('[Google Drive] Failed to load GAPI script');
      reject(new Error('Failed to load Google API'));
    };
    document.body.appendChild(script);
  });
};

// Initialize Google Picker API
const loadGoogleDrivePickerWeb = async (): Promise<void> => {
  if (pickerApiLoaded) {
    console.log('[Google Drive] Picker already loaded');
    return;
  }

  try {
    console.log('[Google Drive] Loading scripts...');
    
    // Load both GIS and GAPI scripts
    await Promise.all([loadGISScript(), loadGAPIScript()]);
    
    // Load the Picker API
    await new Promise<void>((resolve, reject) => {
      window.gapi.load('picker', {
        callback: () => {
          console.log('[Google Drive] Picker API loaded');
          pickerApiLoaded = true;
          resolve();
        },
        onerror: () => {
          console.error('[Google Drive] Failed to load Picker API');
          reject(new Error('Failed to load Google Picker API'));
        },
      });
    });

    console.log('[Google Drive] All scripts loaded successfully');
  } catch (error) {
    console.error('[Google Drive] Error loading scripts:', error);
    throw error;
  }
};

// Authenticate using Google Identity Services (GIS)
const authenticate = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log('[Google Drive] Starting authentication...');

    // Check if we have a valid cached token
    if (accessToken && tokenExpiry > Date.now()) {
      console.log('[Google Drive] Using cached token');
      resolve(accessToken);
      return;
    }

    // Clear expired token
    if (accessToken && tokenExpiry <= Date.now()) {
      console.log('[Google Drive] Token expired, clearing cache');
      accessToken = null;
      tokenExpiry = 0;
    }

    try {
      // Store current promise handlers at module level
      currentResolve = resolve;
      currentReject = reject;

      // Initialize token client if not already done
      if (!tokenClient) {
        console.log('[Google Drive] Initializing token client...');
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.error) {
              console.error('[Google Drive] Auth error:', response);
              accessToken = null;
              tokenExpiry = 0;
              currentReject?.(new Error(response.error_description || 'Authentication failed'));
              return;
            }

            console.log('[Google Drive] Authentication successful');
            accessToken = response.access_token;
            // Set expiry to 55 minutes from now (tokens typically valid for 1 hour)
            tokenExpiry = Date.now() + (55 * 60 * 1000);
            currentResolve?.(response.access_token);
          },
          error_callback: (error: any) => {
            console.error('[Google Drive] Auth error callback:', error);
            accessToken = null;
            tokenExpiry = 0;
            
            // Detect mobile popup blocking
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
              currentReject?.(new Error('Unable to open sign-in popup. Please enable popups for this site in your mobile browser settings.'));
            } else {
              currentReject?.(new Error('Authentication popup was closed or failed. Please try again.'));
            }
          },
        });
      }

      // Request access token
      console.log('[Google Drive] Requesting access token...');
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (error) {
      console.error('[Google Drive] Authentication error:', error);
      accessToken = null;
      tokenExpiry = 0;
      
      if (error instanceof Error) {
        if (error.message.includes('popup')) {
          reject(new Error('Popup blocked by browser. Please allow popups for this site.'));
        } else {
          reject(error);
        }
      } else {
        reject(new Error('Authentication failed. Please try again.'));
      }
    }
  });
};

const openWebGooglePicker = async (): Promise<GoogleDriveFile | null> => {
  try {
    console.log('[Google Drive] Opening web picker...');
    
    await loadGoogleDrivePickerWeb();
    const token = await authenticate();

    console.log('[Google Drive] Building picker...');

    // Lock body scroll to prevent interference with picker
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return new Promise((resolve, reject) => {
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false)
        .setParent('root'); // Enable folder navigation

      // Set mobile-optimized dimensions
      const isMobile = window.innerWidth < 768;
      const pickerWidth = isMobile ? Math.min(window.innerWidth - 20, 600) : 600;
      const pickerHeight = isMobile ? window.innerHeight - 100 : 425;

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setSize(pickerWidth, pickerHeight)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            console.log('[Google Drive] File picked:', data.docs[0].name);
            const file = data.docs[0];
            
            // Restore body scroll
            document.body.style.overflow = originalOverflow;
            
            resolve({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              url: file.url,
              downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            });
          } else if (data.action === window.google.picker.Action.CANCEL) {
            console.log('[Google Drive] Picker cancelled');
            
            // Restore body scroll
            document.body.style.overflow = originalOverflow;
            
            resolve(null);
          }
        })
        .build();

      console.log('[Google Drive] Showing picker...');
      picker.setVisible(true);
    });
  } catch (error) {
    console.error('[Google Drive] Error opening picker:', error);
    
    // Restore body scroll on error
    document.body.style.overflow = '';
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to open Google Drive picker. Please try again.');
  }
};

// ==================== PUBLIC API ====================

// Main entry point - detects platform and uses appropriate picker
export const openGoogleDrivePicker = async (): Promise<GoogleDriveFile | null> => {
  if (Capacitor.isNativePlatform()) {
    console.log('[Google Drive] Using native file picker for Android/iOS');
    return openNativeFilePicker();
  } else {
    console.log('[Google Drive] Using web-based Google Drive picker');
    return openWebGooglePicker();
  }
};

// Legacy export for compatibility
export const loadGoogleDrivePicker = async (): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    await loadGoogleDrivePickerWeb();
  }
};

// Map Google Docs mime types to export formats
const GOOGLE_DOCS_MIME_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing': 'application/pdf',
};

export const downloadFileFromGoogleDrive = async (file: GoogleDriveFile): Promise<Blob> => {
  // If blob is already available (from native picker), return it directly
  if (file.blob) {
    console.log('[Google Drive] Using pre-downloaded blob from native picker');
    return file.blob;
  }

  // Web picker flow - need to download from Google Drive API
  if (!accessToken) {
    throw new Error('Not authenticated with Google Drive. Please try selecting a file again.');
  }

  console.log('[Google Drive] Downloading file:', file.name, 'mimeType:', file.mimeType);

  try {
    let downloadUrl: string;
    
    // Check if it's a Google Docs file that needs export
    if (GOOGLE_DOCS_MIME_TYPES[file.mimeType]) {
      const exportMimeType = GOOGLE_DOCS_MIME_TYPES[file.mimeType];
      downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
      console.log('[Google Drive] Using export endpoint for Google Docs file');
    } else {
      // Use the file's download URL or construct one
      downloadUrl = file.downloadUrl || `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      console.log('[Google Drive] Using direct download for regular file');
    }
    
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(downloadUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Google Drive authentication expired. Please try again.');
      } else if (response.status === 403) {
        throw new Error('Access denied to this file. Please check permissions.');
      } else if (response.status === 404) {
        throw new Error('File not found in Google Drive.');
      }
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    console.log('[Google Drive] File downloaded successfully');
    return await response.blob();
  } catch (error) {
    console.error('[Google Drive] Download error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Download timed out. Please try a smaller file or check your connection.');
    }
    
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while downloading from Google Drive. Please check your connection.');
  }
};
