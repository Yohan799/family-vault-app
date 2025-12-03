import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ListFilesRequest {
  action: 'list';
  accessToken: string;
  folderId?: string;
  pageToken?: string;
}

interface DownloadFileRequest {
  action: 'download';
  accessToken: string;
  fileId: string;
  mimeType: string;
}

interface SearchFilesRequest {
  action: 'search';
  accessToken: string;
  query: string;
  pageToken?: string;
}

type RequestBody = ListFilesRequest | DownloadFileRequest | SearchFilesRequest;

// Map Google Docs mime types to export formats
const GOOGLE_DOCS_EXPORT_TYPES: Record<string, string> = {
  'application/vnd.google-apps.document': 'application/pdf',
  'application/vnd.google-apps.spreadsheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.google-apps.presentation': 'application/pdf',
  'application/vnd.google-apps.drawing': 'application/pdf',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();
    console.log('[Google Drive Proxy] Action:', body.action);

    if (!body.accessToken) {
      return new Response(
        JSON.stringify({ error: 'Missing access token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    switch (body.action) {
      case 'list': {
        const { accessToken, folderId, pageToken } = body;
        const parentId = folderId || 'root';
        
        let url = `https://www.googleapis.com/drive/v3/files?q='${parentId}'+in+parents+and+trashed=false&fields=nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,modifiedTime,size)&pageSize=50&orderBy=folder,name`;
        
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        console.log('[Google Drive Proxy] Listing files in folder:', parentId);
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('[Google Drive Proxy] List error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to list files', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log('[Google Drive Proxy] Found', data.files?.length || 0, 'files');
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'search': {
        const { accessToken, query, pageToken } = body;
        
        const escapedQuery = query.replace(/'/g, "\\'");
        let url = `https://www.googleapis.com/drive/v3/files?q=name+contains+'${escapedQuery}'+and+trashed=false&fields=nextPageToken,files(id,name,mimeType,iconLink,thumbnailLink,modifiedTime,size)&pageSize=50&orderBy=folder,name`;
        
        if (pageToken) {
          url += `&pageToken=${pageToken}`;
        }

        console.log('[Google Drive Proxy] Searching for:', query);
        
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('[Google Drive Proxy] Search error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to search files', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const data = await response.json();
        console.log('[Google Drive Proxy] Found', data.files?.length || 0, 'files');
        
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'download': {
        const { accessToken, fileId, mimeType } = body;
        
        let downloadUrl: string;
        let finalMimeType = mimeType;
        
        // Check if it's a Google Docs file that needs export
        if (GOOGLE_DOCS_EXPORT_TYPES[mimeType]) {
          const exportMimeType = GOOGLE_DOCS_EXPORT_TYPES[mimeType];
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=${encodeURIComponent(exportMimeType)}`;
          finalMimeType = exportMimeType;
          console.log('[Google Drive Proxy] Exporting Google Docs file as:', exportMimeType);
        } else {
          downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
          console.log('[Google Drive Proxy] Downloading file directly');
        }

        const response = await fetch(downloadUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });

        if (!response.ok) {
          const error = await response.text();
          console.error('[Google Drive Proxy] Download error:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to download file', details: error }),
            { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        console.log('[Google Drive Proxy] File downloaded, size:', blob.size);
        
        return new Response(
          JSON.stringify({ data: base64, mimeType: finalMimeType, size: blob.size }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[Google Drive Proxy] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
