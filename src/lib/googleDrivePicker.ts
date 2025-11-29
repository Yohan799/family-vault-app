// Google Drive Picker Integration using Google Identity Services (GIS)

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let pickerApiLoaded = false;
let tokenClient: any = null;
let accessToken: string | null = null;
let currentResolve: ((token: string) => void) | null = null;
let currentReject: ((error: Error) => void) | null = null;

// These are public keys that can be stored in code
const GOOGLE_API_KEY = 'AIzaSyC33PFiW54pUdt_oIUYVLweVX6KOaiHxdw';
const CLIENT_ID = '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

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
export const loadGoogleDrivePicker = async (): Promise<void> => {
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
              currentReject?.(new Error(response.error_description || 'Authentication failed'));
              return;
            }

            console.log('[Google Drive] Authentication successful');
            accessToken = response.access_token;
            currentResolve?.(response.access_token);
          },
          error_callback: (error: any) => {
            console.error('[Google Drive] Auth error callback:', error);
            currentReject?.(new Error('Authentication popup was closed or failed'));
          },
        });
      }

      // Request access token
      console.log('[Google Drive] Requesting access token...');
      tokenClient.requestAccessToken({ prompt: '' });
    } catch (error) {
      console.error('[Google Drive] Authentication error:', error);
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

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  url: string;
  downloadUrl?: string;
}

export const openGoogleDrivePicker = async (): Promise<GoogleDriveFile | null> => {
  try {
    console.log('[Google Drive] Opening picker...');
    
    await loadGoogleDrivePicker();
    const token = await authenticate();

    console.log('[Google Drive] Building picker...');

    return new Promise((resolve, reject) => {
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(false);

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .addView(new window.google.picker.DocsUploadView())
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_API_KEY)
        .setCallback((data: any) => {
          if (data.action === window.google.picker.Action.PICKED) {
            console.log('[Google Drive] File picked:', data.docs[0].name);
            const file = data.docs[0];
            resolve({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              url: file.url,
              downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            });
          } else if (data.action === window.google.picker.Action.CANCEL) {
            console.log('[Google Drive] Picker cancelled');
            resolve(null);
          }
        })
        .build();

      console.log('[Google Drive] Showing picker...');
      picker.setVisible(true);
    });
  } catch (error) {
    console.error('[Google Drive] Error opening picker:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to open Google Drive picker. Please try again.');
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
