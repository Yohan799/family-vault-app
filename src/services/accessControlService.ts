import {
    AccessLevel,
    NomineeAccess,
    CategoryAccess,
    SubcategoryAccess,
    DocumentAccess,
    AccessSummary
} from '../types/access';

// This service will be replaced with Supabase implementation
// For now, using localStorage to demonstrate the functionality

const STORAGE_KEYS = {
    categoryAccess: 'family_vault_category_access',
    subcategoryAccess: 'family_vault_subcategory_access',
    documentAccess: 'family_vault_document_access',
};

export const accessControlService = {
    // Get all nominees with their access status for a resource
    async getAccessSummary(
        resourceType: AccessLevel,
        resourceId: string
    ): Promise<AccessSummary> {
        const nominees = JSON.parse(localStorage.getItem('nominees') || '[]');
        const accessList = this.getAccessList(resourceType);

        const accessDetails: NomineeAccess[] = nominees.map((nominee: any) => ({
            nomineeId: nominee.id,
            nomineeName: nominee.fullName,
            nomineeEmail: nominee.email,
            nomineeAvatar: nominee.avatar,
            hasAccess: accessList.some(
                (access: any) =>
                    access.nomineeId === nominee.id &&
                    this.getResourceIdFromAccess(resourceType, access) === resourceId
            ),
        }));

        return {
            totalNominees: nominees.length,
            nomineesWithAccess: accessDetails.filter(n => n.hasAccess).length,
            accessDetails,
        };
    },

    // Grant access to a nominee for a resource
    async grantAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeId: string
    ): Promise<void> {
        const accessList = this.getAccessList(resourceType);

        // Check if access already exists
        const existingAccess = accessList.find(
            (access: any) =>
                access.nomineeId === nomineeId &&
                this.getResourceIdFromAccess(resourceType, access) === resourceId
        );

        if (!existingAccess) {
            const newAccess = this.createAccessRecord(resourceType, resourceId, nomineeId);
            accessList.push(newAccess);
            this.saveAccessList(resourceType, accessList);
        }
    },

    // Revoke access from a nominee for a resource
    async revokeAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeId: string
    ): Promise<void> {
        const accessList = this.getAccessList(resourceType);

        const filteredList = accessList.filter(
            (access: any) =>
                !(access.nomineeId === nomineeId &&
                    this.getResourceIdFromAccess(resourceType, access) === resourceId)
        );

        this.saveAccessList(resourceType, filteredList);
    },

    // Toggle access for a nominee
    async toggleAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeId: string,
        grant: boolean
    ): Promise<void> {
        if (grant) {
            await this.grantAccess(resourceType, resourceId, nomineeId);
        } else {
            await this.revokeAccess(resourceType, resourceId, nomineeId);
        }
    },

    // Check if a nominee has access to a resource (including inherited access)
    async hasAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeId: string,
        categoryId?: string,
        subcategoryId?: string
    ): Promise<boolean> {
        // Check direct access
        const accessList = this.getAccessList(resourceType);
        const directAccess = accessList.some(
            (access: any) =>
                access.nomineeId === nomineeId &&
                this.getResourceIdFromAccess(resourceType, access) === resourceId
        );

        if (directAccess) return true;

        // Check inherited access (category -> subcategory -> document)
        if (resourceType === 'document' && categoryId) {
            const categoryAccessList = this.getAccessList('category');
            const hasCategoryAccess = categoryAccessList.some(
                (access: any) => access.nomineeId === nomineeId && access.categoryId === categoryId
            );
            if (hasCategoryAccess) return true;

            if (subcategoryId) {
                const subcategoryAccessList = this.getAccessList('subcategory');
                const hasSubcategoryAccess = subcategoryAccessList.some(
                    (access: any) => access.nomineeId === nomineeId && access.subcategoryId === subcategoryId
                );
                if (hasSubcategoryAccess) return true;
            }
        }

        if (resourceType === 'subcategory' && categoryId) {
            const categoryAccessList = this.getAccessList('category');
            const hasCategoryAccess = categoryAccessList.some(
                (access: any) => access.nomineeId === nomineeId && access.categoryId === categoryId
            );
            if (hasCategoryAccess) return true;
        }

        return false;
    },

    // Get all resources a nominee has access to
    async getNomineeAccessibleResources(
        resourceType: AccessLevel,
        nomineeId: string
    ): Promise<string[]> {
        const accessList = this.getAccessList(resourceType);
        return accessList
            .filter((access: any) => access.nomineeId === nomineeId)
            .map((access: any) => this.getResourceIdFromAccess(resourceType, access));
    },

    // Helper: Get access list from localStorage
    getAccessList(resourceType: AccessLevel): any[] {
        const key = this.getStorageKey(resourceType);
        return JSON.parse(localStorage.getItem(key) || '[]');
    },

    // Helper: Save access list to localStorage
    saveAccessList(resourceType: AccessLevel, accessList: any[]): void {
        const key = this.getStorageKey(resourceType);
        localStorage.setItem(key, JSON.stringify(accessList));
    },

    // Helper: Get storage key for resource type
    getStorageKey(resourceType: AccessLevel): string {
        switch (resourceType) {
            case 'category':
                return STORAGE_KEYS.categoryAccess;
            case 'subcategory':
                return STORAGE_KEYS.subcategoryAccess;
            case 'document':
                return STORAGE_KEYS.documentAccess;
        }
    },

    // Helper: Create access record
    createAccessRecord(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeId: string
    ): any {
        const baseRecord = {
            id: `access_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            nomineeId,
            grantedAt: new Date().toISOString(),
        };

        switch (resourceType) {
            case 'category':
                return { ...baseRecord, categoryId: resourceId };
            case 'subcategory':
                return { ...baseRecord, subcategoryId: resourceId };
            case 'document':
                return { ...baseRecord, documentId: resourceId };
        }
    },

    // Helper: Get resource ID from access record
    getResourceIdFromAccess(resourceType: AccessLevel, access: any): string {
        switch (resourceType) {
            case 'category':
                return access.categoryId;
            case 'subcategory':
                return access.subcategoryId;
            case 'document':
                return access.documentId;
        }
    },

    // Clear all access for a resource (useful when deleting)
    async clearAllAccess(resourceType: AccessLevel, resourceId: string): Promise<void> {
        const accessList = this.getAccessList(resourceType);
        const filteredList = accessList.filter(
            (access: any) => this.getResourceIdFromAccess(resourceType, access) !== resourceId
        );
        this.saveAccessList(resourceType, filteredList);
    },

    // Bulk grant access
    async bulkGrantAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeIds: string[]
    ): Promise<void> {
        for (const nomineeId of nomineeIds) {
            await this.grantAccess(resourceType, resourceId, nomineeId);
        }
    },

    // Bulk revoke access
    async bulkRevokeAccess(
        resourceType: AccessLevel,
        resourceId: string,
        nomineeIds: string[]
    ): Promise<void> {
        for (const nomineeId of nomineeIds) {
            await this.revokeAccess(resourceType, resourceId, nomineeId);
        }
    },
};
