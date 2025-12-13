import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

// Predefined avatar options with emoji/icon designs
export const AVATAR_OPTIONS = [
  { id: "avatar-1", emoji: "👤", bg: "bg-blue-100", color: "text-blue-600" },
  { id: "avatar-2", emoji: "👨", bg: "bg-blue-100", color: "text-blue-600" },
  { id: "avatar-3", emoji: "👩", bg: "bg-pink-100", color: "text-pink-600" },
  { id: "avatar-4", emoji: "👴", bg: "bg-orange-100", color: "text-orange-600" },
  { id: "avatar-5", emoji: "👵", bg: "bg-red-100", color: "text-red-600" },
  { id: "avatar-6", emoji: "👨‍💼", bg: "bg-cyan-100", color: "text-cyan-600" },
  { id: "avatar-7", emoji: "👩‍💼", bg: "bg-teal-100", color: "text-teal-600" },
  { id: "avatar-8", emoji: "👨‍🎓", bg: "bg-indigo-100", color: "text-indigo-600" },
  { id: "avatar-9", emoji: "👩‍🎓", bg: "bg-violet-100", color: "text-violet-600" },
  { id: "avatar-10", emoji: "👶", bg: "bg-amber-100", color: "text-amber-600" },
  { id: "avatar-11", emoji: "🧑", bg: "bg-lime-100", color: "text-lime-600" },
  { id: "avatar-12", emoji: "👨‍⚕️", bg: "bg-emerald-100", color: "text-emerald-600" },
  { id: "avatar-13", emoji: "👩‍⚕️", bg: "bg-sky-100", color: "text-sky-600" },
  { id: "avatar-14", emoji: "👨‍🏫", bg: "bg-rose-100", color: "text-rose-600" },
  { id: "avatar-15", emoji: "👩‍🏫", bg: "bg-fuchsia-100", color: "text-fuchsia-600" },
];

interface AvatarSelectorProps {
  selectedAvatar: string | null;
  onSelectAvatar: (avatarId: string) => void;
}

export const AvatarSelector = ({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) => {
  const [open, setOpen] = useState(false);

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === selectedAvatar) || AVATAR_OPTIONS[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-20 h-20 rounded-full p-0 relative border-2 border-border hover:border-primary transition-all"
        >
          <div className={`w-full h-full rounded-full ${currentAvatar.bg} flex items-center justify-center`}>
            <span className={`text-3xl ${currentAvatar.color}`}>{currentAvatar.emoji}</span>
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5">
            <Camera className="w-3 h-3" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Select Avatar</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-5 gap-3 py-4">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              onClick={() => {
                onSelectAvatar(avatar.id);
                setOpen(false);
              }}
              className={`w-14 h-14 rounded-full ${avatar.bg} flex items-center justify-center transition-all hover:scale-110 ${selectedAvatar === avatar.id ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
            >
              <span className={`text-2xl ${avatar.color}`}>{avatar.emoji}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to get avatar details
export const getAvatarById = (avatarId: string | null) => {
  return AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[0];
};
