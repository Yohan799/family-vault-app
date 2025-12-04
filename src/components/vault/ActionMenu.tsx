import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Shield, Trash2, Eye, Download, Users } from 'lucide-react';

interface ActionMenuItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
}

interface ActionMenuProps {
    items: ActionMenuItem[];
}

export const ActionMenu: React.FC<ActionMenuProps> = ({ items }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [openAbove, setOpenAbove] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Calculate if button is in bottom 40% of viewport
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            // Open above if button is in bottom 40% of screen
            setOpenAbove(rect.bottom > viewportHeight * 0.6);
        }
        
        setIsOpen(!isOpen);
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                ref={buttonRef}
                onClick={handleToggle}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="More options"
            >
                <MoreVertical className="w-5 h-5 text-gray-700" />
            </button>

            {isOpen && (
                <div 
                    className={`absolute right-0 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[180px] z-50 ${
                        openAbove ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                >
                    {items.map((item, index) => (
                        <button
                            key={index}
                            onClick={(e) => {
                                e.stopPropagation();
                                item.onClick();
                                setIsOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left ${item.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium text-sm">{item.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Preset action menus for common use cases
export const createCategoryActionMenu = (
    onManageAccess: () => void,
    onDelete?: () => void
): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
        {
            label: 'Manage Access',
            icon: <Shield className="w-4 h-4" />,
            onClick: onManageAccess,
        },
    ];

    if (onDelete) {
        items.push({
            label: 'Delete Category',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onDelete,
            variant: 'danger',
        });
    }

    return items;
};

export const createSubcategoryActionMenu = (
    onManageAccess: () => void,
    onDelete?: () => void
): ActionMenuItem[] => {
    const items: ActionMenuItem[] = [
        {
            label: 'Manage Access',
            icon: <Shield className="w-4 h-4" />,
            onClick: onManageAccess,
        },
    ];

    if (onDelete) {
        items.push({
            label: 'Delete Subcategory',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onDelete,
            variant: 'danger',
        });
    }

    return items;
};

export const createDocumentActionMenu = (
    onView: () => void,
    onDownload: () => void,
    onManageAccess: () => void,
    onDelete: () => void
): ActionMenuItem[] => {
    return [
        {
            label: 'View',
            icon: <Eye className="w-4 h-4" />,
            onClick: onView,
        },
        {
            label: 'Download',
            icon: <Download className="w-4 h-4" />,
            onClick: onDownload,
        },
        {
            label: 'Who has access',
            icon: <Users className="w-4 h-4" />,
            onClick: onManageAccess,
        },
        {
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            onClick: onDelete,
            variant: 'danger',
        },
    ];
};
