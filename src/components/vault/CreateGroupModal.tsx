import React, { useState } from 'react';
import { X, FolderPlus, Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, Shield, FileText, Lock, Star, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { GROUP_ICONS, GROUP_COLORS, CreateGroupInput } from '@/types/groups';

interface CreateGroupModalProps {
    isOpen: boolean;
    subcategoryId: string;
    onClose: () => void;
    onCreateGroup: (group: CreateGroupInput) => Promise<void>;
}

// Icon mapping
const IconComponents: Record<string, React.ElementType> = {
    Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, Shield, FileText, Lock, Star, Folder
};

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
    isOpen,
    subcategoryId,
    onClose,
    onCreateGroup,
}) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('Folder');
    const [selectedColor, setSelectedColor] = useState('bg-blue-500');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            setError('Please enter a group name');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await onCreateGroup({
                name: name.trim(),
                subcategory_id: subcategoryId,
                icon: selectedIcon,
                icon_bg_color: selectedColor,
            });

            // Reset form
            setName('');
            setSelectedIcon('Folder');
            setSelectedColor('bg-blue-500');
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create group');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setName('');
        setSelectedIcon('Folder');
        setSelectedColor('bg-blue-500');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${selectedColor}`}>
                            <FolderPlus className="w-5 h-5 text-white" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Create Group
                        </h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-5">
                    {/* Group Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Group Name
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Son's Medical, Family Documents"
                            className="w-full"
                            autoFocus
                        />
                    </div>

                    {/* Icon Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Choose Icon
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {GROUP_ICONS.map((icon) => {
                                const IconComponent = IconComponents[icon.name];
                                return (
                                    <button
                                        key={icon.name}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon.name)}
                                        className={`p-3 rounded-lg flex items-center justify-center transition-all ${selectedIcon === icon.name
                                                ? `${selectedColor} text-white ring-2 ring-offset-2 ring-blue-500`
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            }`}
                                        title={icon.label}
                                    >
                                        <IconComponent className="w-5 h-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Color Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Choose Color
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {GROUP_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setSelectedColor(color.value)}
                                    className={`h-10 rounded-lg ${color.value} transition-all ${selectedColor === color.value
                                            ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-105'
                                            : 'hover:scale-105'
                                        }`}
                                    title={color.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Preview
                        </label>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className={`p-3 rounded-xl ${selectedColor}`}>
                                {(() => {
                                    const IconComponent = IconComponents[selectedIcon];
                                    return <IconComponent className="w-6 h-6 text-white" />;
                                })()}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {name || 'Group Name'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    0 documents
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isLoading || !name.trim()}
                        >
                            {isLoading ? 'Creating...' : 'Create Group'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
