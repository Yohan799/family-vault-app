import React, { useEffect, useState } from 'react';
import { X, Shield, User, Check, UserCheck, UserX, Users } from 'lucide-react';
import { AccessControlProps, NomineeAccess, AccessSummary } from '../../types/access';
import { accessControlService } from '../../services/accessControlService';

export const AccessControlModal: React.FC<AccessControlProps> = ({
    isOpen,
    resourceType,
    resourceId,
    resourceName,
    onClose,
    onAccessChanged,
}) => {
    if (!isOpen) return null;
    const [accessSummary, setAccessSummary] = useState<AccessSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingNomineeId, setSavingNomineeId] = useState<string | null>(null);

    useEffect(() => {
        loadAccessData();
    }, [resourceType, resourceId]);

    const loadAccessData = async () => {
        setLoading(true);
        try {
            const summary = await accessControlService.getAccessSummary(resourceType, resourceId);
            setAccessSummary(summary);
        } catch (error) {
            console.error('Failed to load access data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAccess = async (nominee: NomineeAccess) => {
        setSavingNomineeId(nominee.nomineeId);
        try {
            await accessControlService.toggleAccess(
                resourceType,
                resourceId,
                nominee.nomineeId,
                !nominee.hasAccess
            );
            await loadAccessData();
            onAccessChanged?.();
        } catch (error) {
            console.error('Failed to toggle access:', error);
        } finally {
            setSavingNomineeId(null);
        }
    };

    const handleGrantAllAccess = async () => {
        if (!accessSummary) return;

        const nomineeIds = accessSummary.accessDetails
            .filter(n => !n.hasAccess)
            .map(n => n.nomineeId);

        setLoading(true);
        try {
            await accessControlService.bulkGrantAccess(resourceType, resourceId, nomineeIds);
            await loadAccessData();
            onAccessChanged?.();
        } catch (error) {
            console.error('Failed to grant all access:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeAllAccess = async () => {
        if (!accessSummary) return;

        const nomineeIds = accessSummary.accessDetails
            .filter(n => n.hasAccess)
            .map(n => n.nomineeId);

        setLoading(true);
        try {
            await accessControlService.bulkRevokeAccess(resourceType, resourceId, nomineeIds);
            await loadAccessData();
            onAccessChanged?.();
        } catch (error) {
            console.error('Failed to revoke all access:', error);
        } finally {
            setLoading(false);
        }
    };

    const getResourceTypeLabel = () => {
        switch (resourceType) {
            case 'category':
                return 'Category';
            case 'subcategory':
                return 'Subcategory';
            case 'folder':
                return 'Group';
            case 'document':
                return 'Document';
            default:
                return 'Resource';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
                {/* Header */}
                <div className="relative p-5 border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Manage Access
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                                {getResourceTypeLabel()}: {resourceName}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent"></div>
                            <p className="text-sm text-gray-500">Loading nominees...</p>
                        </div>
                    ) : accessSummary ? (
                        <>
                            {/* Access Stats */}
                            <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {accessSummary.nomineesWithAccess}/{accessSummary.totalNominees}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Nominees with access
                                        </p>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                {accessSummary.totalNominees > 0 && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGrantAllAccess}
                                            disabled={accessSummary.nomineesWithAccess === accessSummary.totalNominees}
                                            className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            title="Grant All"
                                        >
                                            <UserCheck className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={handleRevokeAllAccess}
                                            disabled={accessSummary.nomineesWithAccess === 0}
                                            className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                            title="Revoke All"
                                        >
                                            <UserX className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Nominees List */}
                            {accessSummary.totalNominees === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium mb-1">No nominees yet</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Add nominees in Settings to manage access
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                                        Nominees
                                    </p>
                                    {accessSummary.accessDetails.map((nominee) => (
                                        <button
                                            key={nominee.nomineeId}
                                            onClick={() => handleToggleAccess(nominee)}
                                            disabled={savingNomineeId === nominee.nomineeId}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all active:scale-[0.98] ${nominee.hasAccess
                                                    ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                                                    : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                                } ${savingNomineeId === nominee.nomineeId ? 'opacity-60' : ''}`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative flex-shrink-0">
                                                {nominee.nomineeAvatar ? (
                                                    <img
                                                        src={nominee.nomineeAvatar}
                                                        alt={nominee.nomineeName}
                                                        className="w-11 h-11 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {nominee.nomineeName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                {/* Status indicator */}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center ${nominee.hasAccess ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                                    }`}>
                                                    {nominee.hasAccess && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 text-left min-w-0">
                                                <p className="font-semibold text-gray-900 dark:text-white truncate">
                                                    {nominee.nomineeName}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                    {nominee.nomineeEmail}
                                                </p>
                                            </div>

                                            {/* Access Badge */}
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 ${nominee.hasAccess
                                                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {savingNomineeId === nominee.nomineeId
                                                    ? 'Saving...'
                                                    : nominee.hasAccess
                                                        ? 'Has Access'
                                                        : 'No Access'}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Failed to load access data</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
