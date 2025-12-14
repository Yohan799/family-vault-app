import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Folder } from "lucide-react";
import { vaultCategories } from "@/data/vaultCategories";
import {
    syncDefaultCategories,
    loadCategoriesOptimized,
    loadSubcategoriesOptimized,
    getAllUserDocuments,
    getAllUserSubcategories,
} from "@/services/vaultService";

// Query keys for cache management
export const vaultKeys = {
    all: ["vault"] as const,
    categories: (userId: string) => [...vaultKeys.all, "categories", userId] as const,
    subcategories: (userId: string, categoryId: string) =>
        [...vaultKeys.all, "subcategories", userId, categoryId] as const,
    documents: (userId: string) => [...vaultKeys.all, "documents", userId] as const,
    allSubcategories: (userId: string) => [...vaultKeys.all, "allSubcategories", userId] as const,
};

// Type for processed category with UI-ready data
export interface ProcessedCategory {
    id: string;
    name: string;
    icon: any;
    iconBgColor: string;
    documentCount: number;
    subcategories: any[];
    isCustom: boolean;
}

// Type for processed subcategory with UI-ready data
export interface ProcessedSubcategory {
    id: string;
    name: string;
    icon: any;
    documentCount: number;
    isCustom: boolean;
}

/**
 * Hook to fetch all categories with document counts (for VaultHome)
 * Also syncs default categories on first load (once per session)
 */
export const useCategories = (userId: string | undefined) => {
    return useQuery({
        queryKey: vaultKeys.categories(userId || ""),
        queryFn: async (): Promise<ProcessedCategory[]> => {
            if (!userId) return [];

            // Sync default categories once per session
            const syncKey = `vault_synced_${userId}`;
            if (!sessionStorage.getItem(syncKey)) {
                await syncDefaultCategories(userId);
                sessionStorage.setItem(syncKey, 'true');
            }

            // Load categories with counts
            const { categories: customCats, docCountMap } = await loadCategoriesOptimized(userId);

            // Start with hardcoded default categories
            const baseCategories: ProcessedCategory[] = vaultCategories.map((cat) => ({
                id: cat.id,
                name: cat.name,
                icon: cat.icon,
                iconBgColor: cat.iconBgColor,
                documentCount: docCountMap.get(cat.id) || 0,
                subcategories: [],
                isCustom: false,
            }));

            // Add custom categories from database
            const customCatsWithCounts: ProcessedCategory[] = customCats.map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                icon: Folder,
                iconBgColor: cat.icon_bg_color || "bg-yellow-100",
                documentCount: docCountMap.get(cat.id) || 0,
                subcategories: [],
                isCustom: true,
            }));

            return [...baseCategories, ...customCatsWithCounts];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch subcategories for a specific category (for CategoryView)
 */
export const useSubcategories = (
    userId: string | undefined,
    categoryId: string | undefined
) => {
    return useQuery({
        queryKey: vaultKeys.subcategories(userId || "", categoryId || ""),
        queryFn: async (): Promise<{
            subcategories: ProcessedSubcategory[];
            totalDocCount: number;
        }> => {
            if (!userId || !categoryId) {
                return { subcategories: [], totalDocCount: 0 };
            }

            // Check if this is a default category
            const defaultCategory = vaultCategories.find(cat => cat.id === categoryId);

            // Load subcategories with counts
            const { subcategories: customSubs, docCountMap, totalDocCount } =
                await loadSubcategoriesOptimized(userId, categoryId);

            // Start with hardcoded subcategories if default category
            let baseSubcategories: ProcessedSubcategory[] = defaultCategory
                ? defaultCategory.subcategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    icon: sub.icon,
                    documentCount: docCountMap.get(sub.id) || 0,
                    isCustom: false,
                }))
                : [];

            // Add custom subcategories
            const customSubsWithCounts: ProcessedSubcategory[] = customSubs.map((sub: any) => ({
                id: sub.id,
                name: sub.name,
                icon: Folder,
                documentCount: docCountMap.get(sub.id) || 0,
                isCustom: true,
            }));

            return {
                subcategories: [...baseSubcategories, ...customSubsWithCounts],
                totalDocCount,
            };
        },
        enabled: !!userId && !!categoryId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch all documents for search functionality
 */
export const useAllDocuments = (userId: string | undefined) => {
    return useQuery({
        queryKey: vaultKeys.documents(userId || ""),
        queryFn: () => getAllUserDocuments(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch all subcategories for search functionality
 */
export const useAllSubcategories = (userId: string | undefined) => {
    return useQuery({
        queryKey: vaultKeys.allSubcategories(userId || ""),
        queryFn: async () => {
            if (!userId) return [];

            const dbSubs = await getAllUserSubcategories(userId);

            // Merge with hardcoded subcategories
            const hardcodedSubs = vaultCategories.flatMap(cat =>
                cat.subcategories.map(sub => ({
                    id: sub.id,
                    name: sub.name,
                    icon: sub.icon,
                    category_id: cat.id,
                    is_custom: false,
                }))
            );

            const subMap = new Map();
            hardcodedSubs.forEach(sub => subMap.set(sub.id, sub));
            dbSubs.forEach(sub => subMap.set(sub.id, sub));

            return Array.from(subMap.values());
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to fetch subcategory view data (documents and folders for SubcategoryView)
 */
export const useSubcategoryViewData = (
    userId: string | undefined,
    categoryId: string | undefined,
    subcategoryId: string | undefined
) => {
    return useQuery({
        queryKey: [...vaultKeys.all, "subcategoryView", userId, categoryId, subcategoryId] as const,
        queryFn: async () => {
            if (!userId || !categoryId || !subcategoryId) {
                return { folders: [], documents: [] };
            }

            // Import dynamically to avoid circular dependencies
            const { supabase } = await import("@/integrations/supabase/client");
            const { getDocuments, formatFileSize } = await import("@/lib/documentStorage");

            // Load folders and documents in parallel
            const [foldersResult, storedDocs] = await Promise.all([
                supabase
                    .from('folders')
                    .select('*')
                    .eq('subcategory_id', subcategoryId)
                    .eq('user_id', userId)
                    .is('parent_folder_id', null)
                    .is('deleted_at', null),
                getDocuments(categoryId, subcategoryId)
            ]);

            const folders = (foldersResult.data || []).map(folder => ({
                id: folder.id,
                name: folder.name,
                documentCount: 0,
                isCustom: true
            }));

            const documents = storedDocs.map(doc => ({
                id: doc.id,
                name: doc.name,
                size: formatFileSize(doc.size),
                date: new Date(doc.date).toLocaleDateString(),
            }));

            return { folders, documents };
        },
        enabled: !!userId && !!categoryId && !!subcategoryId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};

/**
 * Hook to invalidate vault caches (useful after mutations like adding/deleting categories)
 */
export const useInvalidateVault = () => {
    const queryClient = useQueryClient();

    return {
        invalidateCategories: (userId: string) =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.categories(userId) }),
        invalidateSubcategories: (userId: string, categoryId: string) =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.subcategories(userId, categoryId) }),
        invalidateSubcategoryView: (userId: string, categoryId: string, subcategoryId: string) =>
            queryClient.invalidateQueries({ queryKey: [...vaultKeys.all, "subcategoryView", userId, categoryId, subcategoryId] }),
        invalidateAll: () =>
            queryClient.invalidateQueries({ queryKey: vaultKeys.all }),
    };
};
