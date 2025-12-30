import React, { useState, useEffect } from 'react';
import { X, FolderPlus, ChevronRight, Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, Shield, FileText, Lock, Star, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentGroup } from '@/types/groups';

interface MoveToGroupModalProps {
    isOpen: boolean;
    groups: DocumentGroup[];
    selectedDocCount: number;
    onClose: () => void;
    onMoveToGroup: (groupId: string) => Promise<void>;
    onCreateNewGroup: () => void;
}

// Icon mapping
const IconComponents: Record<string, React.ElementType> = {
    Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, Shield, FileText, Lock, Star, Folder
};

const MoveToGroupModal: React.FC<MoveToGroupModalProps> = ({
    isOpen,
    groups,
    selectedDocCount,
    onClose,
    onMoveToGroup,
    onCreateNewGroup,
}) => {
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setSelectedGroupId(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleMove = async () => {
        if (!selectedGroupId) return;

        setIsMoving(true);
        try {
            await onMoveToGroup(selectedGroupId);
            onClose();
        } catch (err) {
            console.error('Failed to move documents:', err);
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Move to Group
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedDocCount} document{selectedDocCount > 1 ? 's' : ''} selected
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Group List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {/* Create New Group Option */}
                    <button
                        onClick={onCreateNewGroup}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                        <div className="p-2 rounded-lg bg-blue-500">
                            <FolderPlus className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                            Create New Group
                        </span>
                        <ChevronRight className="w-5 h-5 text-blue-400 ml-auto" />
                    </button>

                    {/* Divider */}
                    {groups.length > 0 && (
                        <div className="flex items-center gap-3 py-2">
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                                Existing Groups
                            </span>
                            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                        </div>
                    )}

                    {/* Existing Groups */}
                    {groups.map((group) => {
                        const IconComponent = IconComponents[group.icon || 'Folder'] || Folder;
                        return (
                            <button
                                key={group.id}
                                onClick={() => setSelectedGroupId(group.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedGroupId === group.id
                                        ? 'bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500'
                                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${group.icon_bg_color || 'bg-gray-500'}`}>
                                    <IconComponent className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {group.name}
                                    </p>
                                    {group.description && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                            {group.description}
                                        </p>
                                    )}
                                </div>
                                {selectedGroupId === group.id && (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                )}
                            </button>
                        );
                    })}

                    {/* Empty State */}
                    {groups.length === 0 && (
                        <div className="text-center py-8">
                            <Folder className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">
                                No groups yet. Create one to organize your documents.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1"
                        disabled={isMoving}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleMove}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedGroupId || isMoving}
                    >
                        {isMoving ? 'Moving...' : 'Move Here'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MoveToGroupModal;
