import { useState, useEffect } from "react";
import { X, FileText, FileSpreadsheet, File, Download, ExternalLink, Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Browser } from '@capacitor/browser';

// Configure PDF worker - use CDN for web only
if (!Capacitor.isNativePlatform()) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.mjs`;
}

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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);

    const isNative = Capacitor.isNativePlatform();

    if (!isOpen) return null;

    const isImage = documentType?.startsWith('image/');
    const isPdf = documentType?.includes('pdf') || documentName?.toLowerCase().endsWith('.pdf');
    const isVideo = documentType?.startsWith('video/');
    const isWord = documentType?.includes('msword') ||
        documentType?.includes('wordprocessingml.document') ||
        documentName?.toLowerCase().endsWith('.doc') ||
        documentName?.toLowerCase().endsWith('.docx');
    const isExcel = documentType?.includes('ms-excel') ||
        documentType?.includes('spreadsheetml.sheet') ||
        documentName?.toLowerCase().endsWith('.xls') ||
        documentName?.toLowerCase().endsWith('.xlsx');

    // Office documents can't be previewed directly - show download option
    const isOfficeDoc = isWord || isExcel;

    // On native APK, PDFs and Office docs need to be opened externally
    const needsExternalViewer = isNative && (isPdf || isOfficeDoc);

    // Get file type display name
    const getFileTypeLabel = () => {
        if (isWord) return 'Word Document';
        if (isExcel) return 'Excel Spreadsheet';
        if (isPdf) return 'PDF Document';
        if (isImage) return 'Image';
        if (isVideo) return 'Video';
        return 'Document';
    };

    // Get file icon
    const getFileIcon = () => {
        if (isWord) return <FileText className="w-20 h-20 text-blue-500" />;
        if (isExcel) return <FileSpreadsheet className="w-20 h-20 text-green-500" />;
        if (isPdf) return <FileText className="w-20 h-20 text-red-500" />;
        return <File className="w-20 h-20 text-muted-foreground" />;
    };

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setLoading(false);
        setError(false);
    }

    function onDocumentLoadError(err: Error) {
        console.error('PDF Load Error:', err);
        setLoading(false);
        setError(true);
    }

    // Open document in external app (for native)
    const handleOpenExternal = async () => {
        try {
            const { Filesystem, Directory } = await import('@capacitor/filesystem');
            const { FileOpener } = await import('@capacitor-community/file-opener');

            // Download file to device cache
            const response = await fetch(documentUrl);
            if (!response.ok) throw new Error('Failed to download file');

            const blob = await response.blob();
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const result = reader.result as string;
                    resolve(result.split(',')[1]);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            // Create safe filename
            const safeFileName = documentName.replace(/[^a-zA-Z0-9._-]/g, '_');

            // Write to cache directory
            const writeResult = await Filesystem.writeFile({
                path: safeFileName,
                data: base64,
                directory: Directory.Cache,
            });

            // Determine MIME type
            let mimeType = documentType || 'application/octet-stream';
            if (!mimeType || mimeType === 'application/octet-stream') {
                const lowerName = documentName.toLowerCase();
                if (lowerName.endsWith('.pdf')) mimeType = 'application/pdf';
                else if (lowerName.endsWith('.doc')) mimeType = 'application/msword';
                else if (lowerName.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                else if (lowerName.endsWith('.xls')) mimeType = 'application/vnd.ms-excel';
                else if (lowerName.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            }

            // Open with native app
            await FileOpener.open({
                filePath: writeResult.uri,
                contentType: mimeType,
            });
        } catch (err) {
            console.error('FileOpener error:', err);
            // Fallback to browser
            try {
                await Browser.open({ url: documentUrl });
            } catch (browserErr) {
                console.error('Browser fallback error:', browserErr);
                handleDownload();
            }
        }
    };

    // Handle download
    const handleDownload = async () => {
        if (isNative) {
            try {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const response = await fetch(documentUrl);
                const blob = await response.blob();

                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });

                const fileName = documentName.replace(/[^a-zA-Z0-9._-]/g, '_');
                await Filesystem.writeFile({
                    path: fileName,
                    data: base64,
                    directory: Directory.Documents,
                });

                alert(`File saved to Documents/${fileName}`);
            } catch (err) {
                console.error('Download error:', err);
                window.open(documentUrl, '_blank');
            }
        } else {
            window.open(documentUrl, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-foreground truncate">
                            {documentName}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {getFileTypeLabel()}
                        </p>
                    </div>
                    {/* PDF Controls */}
                    {isPdf && !error && numPages && (
                        <div className="flex items-center gap-2 mr-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                                disabled={scale <= 0.5}
                            >
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground w-8 text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setScale(s => Math.min(3, s + 0.1))}
                                disabled={scale >= 3}
                            >
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>
                    )}
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
                <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100/50">
                    {/* Images */}
                    {isImage && (
                        <div className="relative w-full h-full flex items-center justify-center">
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            )}
                            <img
                                src={documentUrl}
                                alt={documentName}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                onLoad={() => setLoading(false)}
                                onError={() => { setLoading(false); setError(true); }}
                            />
                        </div>
                    )}

                    {/* PDF Viewer - Web only, native uses external viewer */}
                    {isPdf && !isImage && !isNative && (
                        <div className="w-full h-full flex flex-col items-center">
                            <div className="relative min-h-[200px] bg-white shadow-lg rounded-lg overflow-hidden">
                                <Document
                                    file={documentUrl}
                                    onLoadSuccess={onDocumentLoadSuccess}
                                    onLoadError={onDocumentLoadError}
                                    loading={
                                        <div className="flex items-center justify-center p-10">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    }
                                    error={
                                        <div className="flex flex-col items-center justify-center p-8 text-destructive">
                                            <p>Failed to load PDF</p>
                                        </div>
                                    }
                                >
                                    <Page
                                        pageNumber={pageNumber}
                                        scale={scale}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        className="shadow-md"
                                    />
                                </Document>
                            </div>

                            {/* Page Controls */}
                            {numPages && (
                                <div className="flex items-center gap-4 mt-4 bg-background/80 backdrop-blur-sm p-2 rounded-full shadow-sm">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={pageNumber <= 1}
                                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-sm font-medium">
                                        {pageNumber} / {numPages}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={pageNumber >= numPages}
                                        onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Native APK: PDF/DOC external viewer prompt */}
                    {needsExternalViewer && (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6">
                                {getFileIcon()}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{documentName}</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Tap below to open this document in your device's viewer app.
                            </p>
                            <Button onClick={handleOpenExternal} className="gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Open Document
                            </Button>
                        </div>
                    )}

                    {/* Video */}
                    {isVideo && (
                        <video
                            src={documentUrl}
                            controls
                            className="max-w-full max-h-[70vh] rounded-lg"
                        >
                            Your browser does not support the video tag.
                        </video>
                    )}

                    {/* Office Documents (DOC/XLS) & Fallback - Web only (native handled above) */}
                    {!needsExternalViewer && (isOfficeDoc || (!isImage && !isPdf && !isVideo)) && (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mb-6">
                                {getFileIcon()}
                            </div>
                            <h3 className="text-xl font-semibold mb-2">{documentName}</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                {isOfficeDoc
                                    ? "This document format requires downloading to view."
                                    : "Preview not available for this file type."
                                }
                            </p>
                            <div className="flex gap-3">
                                <Button onClick={handleDownload} className="gap-2">
                                    <Download className="w-4 h-4" />
                                    Download File
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Error state fallback (non-PDF) */}
                    {error && !isPdf && (
                        <div className="flex flex-col items-center justify-center text-center p-8">
                            <File className="w-16 h-16 text-destructive mb-4" />
                            <p className="text-lg font-medium mb-2">Failed to load preview</p>
                            <Button onClick={handleDownload} className="gap-2">
                                <Download className="w-4 h-4" />
                                Download File
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

