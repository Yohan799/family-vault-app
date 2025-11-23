import React, { useEffect, useState } from 'react';
import { Shield, Users } from 'lucide-react';
import { AccessLevel } from '../../types/access';
import { accessControlService } from '../../services/accessControlService';

interface AccessIndicatorProps {
    resourceType: AccessLevel;
    resourceId: string;
    onClick?: () => void;
    compact?: boolean;
}

export const AccessIndicator: React.FC<AccessIndicatorProps> = ({
    resourceType,
    resourceId,
    onClick,
    compact = false,
}) => {
    const [nomineeCount, setNomineeCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAccessCount();
    }, [resourceType, resourceId]);

    const loadAccessCount = async () => {
        setLoading(true);
        try {
            const summary = await accessControlService.getAccessSummary(resourceType, resourceId);
            setNomineeCount(summary.nomineesWithAccess);
        } catch (error) {
            console.error('Failed to load access count:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return compact ? null : (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                <Shield className="w-4 h-4 animate-pulse" />
                <span>...</span>
            </div>
        );
    }

    if (compact) {
        return nomineeCount > 0 ? (
            <button
                onClick={onClick}
                className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200 transition-colors"
                title={`${nomineeCount} nominee${nomineeCount !== 1 ? 's' : ''} have access`}
            >
                <Shield className="w-3 h-3" />
                <span>{nomineeCount}</span>
            </button>
        ) : null;
    }

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all ${nomineeCount > 0
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
        >
            {nomineeCount > 0 ? (
                <>
                    <Users className="w-4 h-4" />
                    <span className="text-sm">
                        {nomineeCount} nominee{nomineeCount !== 1 ? 's' : ''} have access
                    </span>
                </>
            ) : (
                <>
                    <Shield className="w-4 h-4" />
                    <span className="text-sm">No access granted</span>
                </>
            )}
        </button>
    );
};
