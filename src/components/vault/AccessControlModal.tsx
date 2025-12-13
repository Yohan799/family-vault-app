import React, { useEffect, useState } from 'react';
import { X, Shield, User, Check, AlertCircle } from 'lucide-react';
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
            case 'document':
                return 'Document';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-full sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-white">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                            <h2 className="text-lg sm:text-2xl font-bold">Manage Access</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 sm:p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                    </div>
                    <p className="text-blue-100 text-xs sm:text-sm truncate">
                        {getResourceTypeLabel()}: <span className="font-semibold">{resourceName}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 sm:py-12">
                            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : accessSummary ? (
                        <>
                            {/* Summary */}
                            <div className="bg-blue-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs sm:text-sm text-gray-600">Access Summary</p>
                                        <p className="text-xl sm:text-2xl font-bold text-blue-600">
                                            {accessSummary.nomineesWithAccess} / {accessSummary.totalNominees}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">nominees with access</p>
                                    </div>
                                    <Shield className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 opacity-20" />
                                </div>
                            </div>

                            {/* Info Banner */}
                            {resourceType !== 'category' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3">
                                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-xs sm:text-sm text-blue-800">
                                        <p className="font-semibold mb-0.5 sm:mb-1">Inherited Access</p>
                                        <p>
                                            Nominees with access to parent {resourceType === 'document' ? 'categories or subcategories' : 'categories'} will
                                            automatically have access to this {resourceType}.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bulk Actions */}
                            {accessSummary.totalNominees > 0 && (
                                <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
                                    <button
                                        onClick={handleGrantAllAccess}
                                        disabled={accessSummary.nomineesWithAccess === accessSummary.totalNominees}
                                        className="flex-1 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Grant All
                                    </button>
                                    <button
                                        onClick={handleRevokeAllAccess}
                                        disabled={accessSummary.nomineesWithAccess === 0}
                                        className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Revoke All
                                    </button>
                                </div>
                            )}

                            {/* Nominees List */}
                            {accessSummary.totalNominees === 0 ? (
                                <div className="text-center py-8 sm:py-12">
                                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                                    <p className="text-gray-500 font-medium text-sm sm:text-base">No nominees added yet</p>
                                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                                        Add nominees first to manage their access
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 sm:space-y-3">
                                    {accessSummary.accessDetails.map((nominee) => (
                                        <div
                                            key={nominee.nomineeId}
                                            className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors gap-2"
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                {/* Avatar */}
                                                {nominee.nomineeAvatar ? (
                                                    <img
                                                        src={nominee.nomineeAvatar}
                                                        alt={nominee.nomineeName}
                                                        className="w-9 h-9 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-lg flex-shrink-0">
                                                        {nominee.nomineeName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">{nominee.nomineeName}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500 truncate">{nominee.nomineeEmail}</p>
                                                </div>
                                            </div>

                                            {/* Access Status & Toggle */}
                                            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                {nominee.hasAccess && (
                                                    <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                        <Check className="w-3 h-3" />
                                                        <span>Access</span>
                                                    </div>
                                                )}

                                                {/* Toggle Button */}
                                                <button
                                                    onClick={() => handleToggleAccess(nominee)}
                                                    disabled={savingNomineeId === nominee.nomineeId}
                                                    className={`relative inline-flex h-6 w-11 sm:h-8 sm:w-14 items-center rounded-full transition-colors ${nominee.hasAccess ? 'bg-green-600' : 'bg-gray-300'
                                                        } ${savingNomineeId === nominee.nomineeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <span
                                                        className={`inline-block h-4 w-4 sm:h-6 sm:w-6 transform rounded-full bg-white transition-transform ${nominee.hasAccess ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-8 sm:py-12">
                            <p className="text-gray-500">Failed to load access data</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-4 sm:p-6 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm sm:text-base"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
