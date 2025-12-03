import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Loader2, FolderOpen, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  listFiles,
  searchFiles,
  downloadFile,
  isFolder,
  getFileIcon,
  GoogleDriveFile,
} from '@/services/googleDriveService';

interface GoogleDriveBrowserProps {
  open: boolean;
  onClose: () => void;
  accessToken: string;
  onFileSelect: (file: File) => void;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveBrowser = ({
  open,
  onClose,
  accessToken,
  onFileSelect,
}: GoogleDriveBrowserProps) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'My Drive' }
  ]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1].id;

  useEffect(() => {
    if (open && accessToken) {
      loadFiles();
    }
  }, [open, accessToken, currentFolderId]);

  const loadFiles = async (pageToken?: string) => {
    setLoading(true);
    try {
      const result = await listFiles(accessToken, currentFolderId, pageToken);
      if (pageToken) {
        setFiles(prev => [...prev, ...result.files]);
      } else {
        setFiles(result.files);
      }
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('[GoogleDriveBrowser] Error loading files:', error);
      toast({
        title: 'Error loading files',
        description: error instanceof Error ? error.message : 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      loadFiles();
      return;
    }

    setLoading(true);
    setIsSearching(true);
    try {
      const result = await searchFiles(accessToken, searchQuery);
      setFiles(result.files);
      setNextPageToken(result.nextPageToken);
    } catch (error) {
      console.error('[GoogleDriveBrowser] Search error:', error);
      toast({
        title: 'Search failed',
        description: error instanceof Error ? error.message : 'Failed to search files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder: GoogleDriveFile) => {
    setSearchQuery('');
    setIsSearching(false);
    setBreadcrumbs(prev => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index: number) => {
    setSearchQuery('');
    setIsSearching(false);
    setBreadcrumbs(prev => prev.slice(0, index + 1));
  };

  const handleFileSelect = async (file: GoogleDriveFile) => {
    if (isFolder(file)) {
      handleFolderClick(file);
      return;
    }

    setDownloading(file.id);
    try {
      toast({
        title: 'Downloading file',
        description: `Downloading ${file.name}...`,
      });

      const blob = await downloadFile(accessToken, file.id, file.mimeType);
      
      // Determine file extension based on mime type
      let fileName = file.name;
      if (file.mimeType.includes('google-apps.document') && !fileName.endsWith('.pdf')) {
        fileName = fileName + '.pdf';
      } else if (file.mimeType.includes('google-apps.spreadsheet') && !fileName.endsWith('.xlsx')) {
        fileName = fileName + '.xlsx';
      } else if (file.mimeType.includes('google-apps.presentation') && !fileName.endsWith('.pdf')) {
        fileName = fileName + '.pdf';
      }

      const downloadedFile = new File([blob], fileName, { type: blob.type });
      onFileSelect(downloadedFile);
      onClose();
      
      toast({
        title: 'File downloaded',
        description: `${fileName} is ready`,
      });
    } catch (error) {
      console.error('[GoogleDriveBrowser] Download error:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Failed to download file',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setIsSearching(false);
    setBreadcrumbs([{ id: 'root', name: 'My Drive' }]);
    setFiles([]);
    onClose();
  };

  const formatFileSize = (size?: string): string => {
    if (!size) return '';
    const bytes = parseInt(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Google Drive
          </DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="p-4 pb-2 border-b border-border/50">
          <div className="flex gap-2">
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} variant="outline" size="icon">
              <Search className="w-4 h-4" />
            </Button>
            {isSearching && (
              <Button 
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                  loadFiles();
                }}
                variant="ghost" 
                size="icon"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        {!isSearching && (
          <div className="px-4 py-2 flex items-center gap-1 text-sm overflow-x-auto">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id} className="flex items-center gap-1 shrink-0">
                {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`hover:text-primary transition-colors ${
                    index === breadcrumbs.length - 1 
                      ? 'font-medium text-foreground' 
                      : 'text-muted-foreground'
                  }`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* File List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          {loading && files.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No files found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleFileSelect(file)}
                  disabled={downloading === file.id}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                    downloading === file.id 
                      ? 'bg-primary/10 cursor-wait' 
                      : 'hover:bg-muted active:scale-[0.99]'
                  }`}
                >
                  <span className="text-xl shrink-0">
                    {downloading === file.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                      getFileIcon(file.mimeType)
                    )}
                  </span>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {isFolder(file) ? 'Folder' : formatFileSize(file.size)}
                      {file.modifiedTime && ` • ${new Date(file.modifiedTime).toLocaleDateString()}`}
                    </p>
                  </div>
                  {isFolder(file) && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
              
              {nextPageToken && (
                <Button
                  variant="ghost"
                  onClick={() => loadFiles(nextPageToken)}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Load more
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button variant="outline" onClick={handleClose} className="w-full">
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
