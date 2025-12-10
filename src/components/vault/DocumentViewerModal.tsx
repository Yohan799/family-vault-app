import { X, FileText, FileSpreadsheet, File, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentUrl: string;
    documentName: string;
    documentType: string;
}

export const DocumentViewerModal = ({
    isOpen,
    onClose,
    documentUrl,
    documentName,
    documentType,
}: DocumentViewerModalProps) => {
    if (!isOpen) return null;

    const isImage = documentType?.startsWith('image/');
    const isPdf = documentType?.includes('pdf');
    const isVideo = documentType?.startsWith('video/');
    const isWord = documentType?.includes('msword') ||
        documentType?.includes('wordprocessingml.document') ||
        documentName?.toLowerCase().endsWith('.doc') ||
        documentName?.toLowerCase().endsWith('.docx');
    const isExcel = documentType?.includes('ms-excel') ||
        documentType?.includes('spreadsheetml.sheet') ||
        documentName?.toLowerCase().endsWith('.xls') ||
        documentName?.toLowerCase().endsWith('.xlsx');

    // Use Google Docs Viewer for Office documents
    const useGoogleViewer = isWord || isExcel || isPdf;
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(documentUrl)}&embedded=true`;

    // Get file type display name
    const getFileTypeLabel = () => {
        if (isWord) return 'Word Document';
        if (isExcel) return 'Excel Spreadsheet';
        if (isPdf) return 'PDF Document';
        return 'Document';
    };

    // Get file icon
    const getFileIcon = () => {
        if (isWord) return <FileText className="w-16 h-16 text-blue-500" />;
        if (isExcel) return <FileSpreadsheet className="w-16 h-16 text-green-500" />;
        if (isPdf) return <FileText className="w-16 h-16 text-red-500" />;
        return <File className="w-16 h-16 text-muted-foreground" />;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground truncate">
                            {documentName}
                        </h2>
                        {useGoogleViewer && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {getFileTypeLabel()} • Powered by Google Docs Viewer
                            </p>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="ml-2 flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Document Viewer */}
                <div className="flex-1 overflow-auto p-4">
                    {isImage && (
                        <img
                            src={documentUrl}
                            alt={documentName}
                            className="max-w-full max-h-full mx-auto"
                        />
                    )}

                    {useGoogleViewer && !isImage && (
                        <iframe
                            src={googleViewerUrl}
                            className="w-full h-full min-h-[600px] border-0 rounded-lg"
                            title={documentName}
                            sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                    )}

                    {isVideo && (
                        <video
                            src={documentUrl}
                            controls
                            className="max-w-full max-h-full mx-auto"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {!isImage && !useGoogleViewer && !isVideo && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                            {getFileIcon()}
                            <p className="text-lg font-medium mt-4 mb-2">
                                {documentName}
                            </p>
                            <p className="text-muted-foreground mb-6">
                                Preview not available for this file type
                            </p>
                            <Button
                                onClick={() => window.open(documentUrl, '_blank')}
                                variant="outline"
                                className="gap-2"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in New Tab
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
