import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Check } from "lucide-react";

interface PhotoGalleryProps {
  open: boolean;
  onClose: () => void;
  photos: string[];
  selectedPhoto: string | null;
  onSelectPhoto: (photo: string) => void;
  onDeletePhoto: (photo: string) => void;
}

export const PhotoGallery = ({
  open,
  onClose,
  photos,
  selectedPhoto,
  onSelectPhoto,
  onDeletePhoto,
}: PhotoGalleryProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Photo Gallery</DialogTitle>
        </DialogHeader>
        {photos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No photos uploaded yet</p>
            <p className="text-sm mt-2">Upload your first photo to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 py-4">
            {photos.map((photo, index) => (
              <div key={index} className="relative group">
                <button
                  onClick={() => onSelectPhoto(photo)}
                  className="relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary"
                  style={{
                    borderColor: selectedPhoto === photo ? "hsl(var(--primary))" : "transparent",
                  }}
                >
                  <Avatar className="w-full h-full rounded-lg">
                    <AvatarImage src={photo} alt={`Photo ${index + 1}`} className="object-cover" />
                  </Avatar>
                  {selectedPhoto === photo && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeletePhoto(photo)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedPhoto) {
                onClose();
              }
            }}
            className="flex-1 bg-primary"
            disabled={!selectedPhoto}
          >
            Select Photo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
