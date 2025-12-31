export type AccessLevel = 'category' | 'subcategory' | 'folder' | 'document';

export interface NomineeAccess {
    nomineeId: string;
    nomineeName: string;
    nomineeEmail: string;
    nomineeAvatar?: string;
    hasAccess: boolean;
}

export interface CategoryAccess {
    id: string;
    categoryId: string;
    nomineeId: string;
    grantedAt: Date;
}

export interface SubcategoryAccess {
    id: string;
    subcategoryId: string;
    nomineeId: string;
    grantedAt: Date;
}

export interface DocumentAccess {
    id: string;
    documentId: string;
    nomineeId: string;
    grantedAt: Date;
}

export interface AccessSummary {
    totalNominees: number;
    nomineesWithAccess: number;
    accessDetails: NomineeAccess[];
}

export interface AccessControlProps {
    isOpen: boolean;
    resourceType: AccessLevel;
    resourceId: string;
    resourceName: string;
    onClose: () => void;
    onAccessChanged?: () => void;
}
