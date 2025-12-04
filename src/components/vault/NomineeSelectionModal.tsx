import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";

interface Nominee {
    id: string;
    fullName: string;
    relationship: string;
    email: string;
    phone: string;
    verified: boolean;
}

interface NomineeSelectionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelectNominee: (nominee: Nominee) => void;
}

export const NomineeSelectionModal = ({
    open,
    onOpenChange,
    onSelectNominee,
}: NomineeSelectionModalProps) => {
    const [nominees, setNominees] = useState<Nominee[]>([]);

    useEffect(() => {
        if (open) {
            // Load nominees from localStorage
            const stored = localStorage.getItem('nominees');
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setNominees(parsed);
                } catch (e) {
                    setNominees([]);
                }
            } else {
                setNominees([]);
            }
        }
    }, [open]);

    const handleSelect = (nominee: Nominee) => {
        onSelectNominee(nominee);
        onOpenChange(false);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-background p-4 sm:p-6">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-center text-lg">Select Nominee</DialogTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Choose a nominee to grant access
                    </p>
                </DialogHeader>

                <div className="space-y-2 max-h-[60vh] overflow-y-auto -mx-2 px-2">
                    {nominees.length === 0 ? (
                        <div className="py-6 text-center">
                            <div className="w-14 h-14 mx-auto mb-3 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserPlus className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1 text-sm">No Nominees Yet</h3>
                            <p className="text-xs text-muted-foreground">
                                Add nominees in the Nominee Center first
                            </p>
                        </div>
                    ) : (
                        nominees.map((nominee) => (
                            <button
                                key={nominee.id}
                                onClick={() => handleSelect(nominee)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left active:scale-[0.98]"
                            >
                                <Avatar className="w-10 h-10 flex-shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                        {getInitials(nominee.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-foreground text-sm truncate">{nominee.fullName}</h3>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {nominee.relationship ? `${nominee.relationship.charAt(0).toUpperCase()}${nominee.relationship.slice(1)} • ` : ''}{nominee.email}
                                    </p>
                                </div>
                                {nominee.verified && (
                                    <div className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex-shrink-0">
                                        Verified
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="w-full h-11 mt-2"
                >
                    Cancel
                </Button>
            </DialogContent>
        </Dialog>
    );
};
