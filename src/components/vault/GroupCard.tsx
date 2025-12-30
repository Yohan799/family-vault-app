import React from 'react';
import { ChevronRight, Shield, Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, FileText, Lock, Star, Folder } from 'lucide-react';
import { DocumentGroup } from '@/types/groups';

interface GroupCardProps {
    group: DocumentGroup;
    documentCount?: number;
    hasAccess?: boolean;
    onClick: () => void;
    onAccessClick?: (e: React.MouseEvent) => void;
}

// Icon mapping
const IconComponents: Record<string, React.ElementType> = {
    Users, Heart, Briefcase, GraduationCap, Home, Car, Wallet, Shield, FileText, Lock, Star, Folder
};

const GroupCard: React.FC<GroupCardProps> = ({
    group,
    documentCount = 0,
    hasAccess = false,
    onClick,
    onAccessClick,
}) => {
    const IconComponent = IconComponents[group.icon || 'Folder'] || Folder;

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
        >
            <div className="flex items-center gap-3">
                {/* Icon */}
                <div className={`p-3 rounded-xl ${group.icon_bg_color || 'bg-blue-500'}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {group.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {documentCount} document{documentCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Access Indicator & Arrow */}
                <div className="flex items-center gap-2">
                    {onAccessClick && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onAccessClick(e);
                            }}
                            className={`p-2 rounded-lg transition-colors ${hasAccess
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                }`}
                            title={hasAccess ? 'Access granted to nominees' : 'Manage access'}
                        >
                            <Shield className="w-4 h-4" />
                        </button>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            {/* Description */}
            {group.description && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 pl-[52px]">
                    {group.description}
                </p>
            )}
        </div>
    );
};

export default GroupCard;
