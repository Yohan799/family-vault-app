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
            <DialogContent className="sm:max-w-md bg-background">
                <DialogHeader>
                    <DialogTitle className="text-center">Select Nominee</DialogTitle>
                    <p className="text-sm text-muted-foreground text-center">
                        Choose a nominee to grant access to this document
                    </p>
                </DialogHeader>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {nominees.length === 0 ? (
                        <div className="py-8 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                                <UserPlus className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-2">No Nominees Yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Add nominees in the Nominee Center first
                            </p>
                        </div>
                    ) : (
                        nominees.map((nominee) => (
                            <button
                                key={nominee.id}
                                onClick={() => handleSelect(nominee)}
                                className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors text-left"
                            >
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(nominee.fullName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground">{nominee.fullName}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {nominee.relationship ? `${nominee.relationship.charAt(0).toUpperCase()}${nominee.relationship.slice(1)} • ` : ''}{nominee.email}
                                    </p>
                                </div>
                                {nominee.verified && (
                                    <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
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
                    className="w-full"
                >
                    Cancel
                </Button>
            </DialogContent>
        </Dialog>
    );
};
