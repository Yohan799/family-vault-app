import { X } from "lucide-react";
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

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-3xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold text-foreground truncate flex-1">
                        {documentName}
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="ml-2"
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

                    {isPdf && (
                        <iframe
                            src={documentUrl}
                            className="w-full h-full min-h-[600px]"
                            title={documentName}
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

                    {!isImage && !isPdf && !isVideo && (
                        <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                            <p className="text-muted-foreground mb-4">
                                Preview not available for this file type
                            </p>
                            <Button
                                onClick={() => window.open(documentUrl, '_blank')}
                                variant="outline"
                            >
                                Open in New Tab
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
