import React, { useEffect, useState } from 'react';
import { X, Shield, User, Check, AlertCircle } from 'lucide-react';
import { AccessControlProps, NomineeAccess, AccessSummary } from '../../types/access';
import { accessControlService } from '../../services/accessControlService';

export const AccessControlModal: React.FC<AccessControlProps> = ({
    resourceType,
    resourceId,
    resourceName,
    onClose,
    onAccessChanged,
}) => {
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6" />
                            <h2 className="text-2xl font-bold">Manage Access</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <p className="text-purple-100 text-sm">
                        {getResourceTypeLabel()}: <span className="font-semibold">{resourceName}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : accessSummary ? (
                        <>
                            {/* Summary */}
                            <div className="bg-purple-50 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Access Summary</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {accessSummary.nomineesWithAccess} / {accessSummary.totalNominees}
                                        </p>
                                        <p className="text-sm text-gray-500">nominees with access</p>
                                    </div>
                                    <Shield className="w-12 h-12 text-purple-600 opacity-20" />
                                </div>
                            </div>

                            {/* Info Banner */}
                            {resourceType !== 'category' && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-blue-800">
                                        <p className="font-semibold mb-1">Inherited Access</p>
                                        <p>
                                            Nominees with access to parent {resourceType === 'document' ? 'categories or subcategories' : 'categories'} will
                                            automatically have access to this {resourceType}.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Bulk Actions */}
                            {accessSummary.totalNominees > 0 && (
                                <div className="flex gap-3 mb-6">
                                    <button
                                        onClick={handleGrantAllAccess}
                                        disabled={accessSummary.nomineesWithAccess === accessSummary.totalNominees}
                                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Grant All Access
                                    </button>
                                    <button
                                        onClick={handleRevokeAllAccess}
                                        disabled={accessSummary.nomineesWithAccess === 0}
                                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        Revoke All Access
                                    </button>
                                </div>
                            )}

                            {/* Nominees List */}
                            {accessSummary.totalNominees === 0 ? (
                                <div className="text-center py-12">
                                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium">No nominees added yet</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Add nominees first to manage their access
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {accessSummary.accessDetails.map((nominee) => (
                                        <div
                                            key={nominee.nomineeId}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                {/* Avatar */}
                                                {nominee.nomineeAvatar ? (
                                                    <img
                                                        src={nominee.nomineeAvatar}
                                                        alt={nominee.nomineeName}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                                        {nominee.nomineeName.charAt(0).toUpperCase()}
                                                    </div>
                                                )}

                                                {/* Info */}
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-800">{nominee.nomineeName}</p>
                                                    <p className="text-sm text-gray-500">{nominee.nomineeEmail}</p>
                                                </div>

                                                {/* Access Status */}
                                                <div className="flex items-center gap-3">
                                                    {nominee.hasAccess && (
                                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                                            <Check className="w-4 h-4" />
                                                            <span>Has Access</span>
                                                        </div>
                                                    )}

                                                    {/* Toggle Button */}
                                                    <button
                                                        onClick={() => handleToggleAccess(nominee)}
                                                        disabled={savingNomineeId === nominee.nomineeId}
                                                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${nominee.hasAccess ? 'bg-green-600' : 'bg-gray-300'
                                                            } ${savingNomineeId === nominee.nomineeId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${nominee.hasAccess ? 'translate-x-7' : 'translate-x-1'
                                                                }`}
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
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
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
