// Google Drive Picker Integration
// This allows users to select files from their Google Drive

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let pickerApiLoaded = false;
let oauthToken: string | null = null;

// These are public keys that can be stored in code
const GOOGLE_API_KEY = 'AIzaSyC33PFiW54pUdt_oIUYVLweVX6KOaiHxdw';
const CLIENT_ID = '714753417430-hlpl9cahk8p6ainp2bpr43703sdkc14u.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export const loadGoogleDrivePicker = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.gapi && pickerApiLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:picker:auth2', () => {
        window.gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          clientId: CLIENT_ID,
          scope: SCOPES,
        }).then(() => {
          pickerApiLoaded = true;
          resolve();
        }).catch(reject);
      });
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const authenticate = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const authInstance = window.gapi.auth2.getAuthInstance();
    
    if (authInstance.isSignedIn.get()) {
      const user = authInstance.currentUser.get();
      const token = user.getAuthResponse().access_token;
      oauthToken = token;
      resolve(token);
    } else {
      authInstance.signIn().then(() => {
        const user = authInstance.currentUser.get();
        const token = user.getAuthResponse().access_token;
        oauthToken = token;
        resolve(token);
      }).catch((error) => {
        if (error.error === 'popup_closed_by_user') {
          reject(new Error('Google sign-in cancelled'));
        } else if (error.error === 'popup_blocked_by_browser') {
          reject(new Error('Popup blocked by browser. Please allow popups for this site.'));
        } else {
          reject(error);
        }
      });
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
    await loadGoogleDrivePicker();
    const token = await authenticate();

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
            const file = data.docs[0];
            resolve({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              url: file.url,
              downloadUrl: `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            });
          } else if (data.action === window.google.picker.Action.CANCEL) {
            resolve(null);
          }
        })
        .build();

      picker.setVisible(true);
    });
  } catch (error) {
    console.error('Error opening Google Drive picker:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to open Google Drive picker. Please try again.');
  }
};

export const downloadFileFromGoogleDrive = async (file: GoogleDriveFile): Promise<Blob> => {
  if (!oauthToken) {
    throw new Error('Not authenticated with Google Drive. Please try selecting a file again.');
  }

  try {
    const response = await fetch(file.downloadUrl!, {
      headers: {
        'Authorization': `Bearer ${oauthToken}`,
      },
    });

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

    return await response.blob();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error while downloading from Google Drive. Please check your connection.');
  }
};
