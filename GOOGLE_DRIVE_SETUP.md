# Google Drive Integration Setup

This app includes Google Drive integration for importing files directly from your Google Drive into the vault and time capsules.

## Setup Instructions

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### 2. Enable Google Drive API

1. In your Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on it and press **Enable**
4. Also enable "Google Picker API"

### 3. Create API Credentials

#### Create API Key:
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **API Key**
3. Copy the API key
4. (Optional) Restrict the API key to only Google Drive API and Picker API for security

#### Create OAuth 2.0 Client ID:
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Configure the OAuth consent screen if prompted:
   - User Type: External
   - App name: Your app name
   - User support email: Your email
   - Developer contact: Your email
4. Select **Web application** as application type
5. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourdomain.com`)
6. Click **Create**
7. Copy the **Client ID**

### 4. Update the Code

Open `src/lib/googleDrivePicker.ts` and replace the placeholder values:

```typescript
const GOOGLE_API_KEY = 'YOUR_API_KEY_HERE';
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

### 5. Test the Integration

1. Go to the Time Capsule page or upload documents in the Vault
2. Click on the Google Drive button
3. You'll be prompted to sign in to your Google account
4. Select a file from your Google Drive
5. The file will be downloaded and attached/uploaded

## Security Notes

- The API Key and Client ID are **public** credentials and can be safely stored in your frontend code
- They are meant to be exposed in client-side applications
- You can restrict them to specific domains and APIs for additional security
- The OAuth flow ensures users authenticate with their own Google accounts
- No server-side secrets are required for this integration

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Make sure you've added your domain to the authorized JavaScript origins
- Verify the OAuth consent screen is properly configured

### "Failed to load Google Drive picker"
- Check that both Google Drive API and Google Picker API are enabled
- Verify your API key is correct and not restricted in a way that blocks the request

### "Failed to download file from Google Drive"
- Ensure the user has granted the necessary permissions
- Check that the file is accessible to the user

## Additional Features

The integration supports:
- ✅ Selecting any file from Google Drive
- ✅ Automatic file download and conversion
- ✅ File validation (size, type)
- ✅ Works in both Time Capsule and Vault document upload
- ✅ Tracks that files came from Google Drive (external_source field)
