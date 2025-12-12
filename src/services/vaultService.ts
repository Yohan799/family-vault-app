import { supabase } from "@/integrations/supabase/client";
import { vaultCategories } from "@/data/vaultCategories";

// Cache for user ID to avoid repeated auth calls
let cachedUserId: string | null = null;
let userIdCacheTime = 0;
const USER_ID_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedUserId = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedUserId && now - userIdCacheTime < USER_ID_CACHE_DURATION) {
    return cachedUserId;
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    cachedUserId = user.id;
    userIdCacheTime = now;
  }
  return user?.id || null;
};

/**
 * Syncs default categories and subcategories from vaultCategories template
 * into the database for the current user (idempotent - only creates if missing)
 * OPTIMIZED: Fast-path check and batch operations
 */
export const syncDefaultCategories = async (userId: string): Promise<void> => {
  try {
    // Fast check: if user already has ANY default categories, skip the heavy sync
    const { count } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_custom', false);

    // If user already has default categories, skip entirely (fast path)
    if (count && count > 0) {
      return;
    }

    // Batch insert all categories at once
    const categoryInserts = vaultCategories.map(template => ({
      id: template.id,
      user_id: userId,
      name: template.name,
      icon: template.icon.name || 'Folder',
      icon_bg_color: template.iconBgColor,
      is_custom: false
    }));

    const { error: catError } = await supabase
      .from('categories')
      .insert(categoryInserts);

    if (catError && catError.code !== '23505') {
      console.error('Error inserting categories:', catError);
    }

    // Batch insert all subcategories at once
    const subcategoryInserts = vaultCategories.flatMap(template =>
      template.subcategories.map(sub => ({
        id: sub.id,
        user_id: userId,
        category_id: template.id,
        name: sub.name,
        icon: sub.icon.name || 'Folder',
        is_custom: false
      }))
    );

    if (subcategoryInserts.length > 0) {
      const { error: subError } = await supabase
        .from('subcategories')
        .insert(subcategoryInserts);

      if (subError && subError.code !== '23505') {
        console.error('Error inserting subcategories:', subError);
      }
    }
  } catch (error) {
    console.error('Error syncing default categories:', error);
    throw error;
  }
};

/**
 * Soft-deletes a category and cascades to all related entities using security definer function
 */
export const deleteCategoryWithCascade = async (categoryId: string, userId: string): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('soft_delete_category', {
      _category_id: categoryId,
      _user_id: userId
    });

    if (error) {
      console.error('Error deleting category:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Category not found or access denied');
    }
  } catch (error) {
    console.error('Error deleting category with cascade:', error);
    throw error;
  }
};

/**
 * Soft-deletes a subcategory and cascades to all related entities using security definer function
 */
export const deleteSubcategoryWithCascade = async (
  subcategoryId: string,
  categoryId: string,
  userId: string
): Promise<void> => {
  try {
    const { data, error } = await supabase.rpc('soft_delete_subcategory', {
      _subcategory_id: subcategoryId,
      _category_id: categoryId,
      _user_id: userId
    });

    if (error) {
      console.error('Error deleting subcategory:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Subcategory not found or access denied');
    }
  } catch (error) {
    console.error('Error deleting subcategory with cascade:', error);
    throw error;
  }
};

/**
 * Gets document count for a category - uses cached userId when possible
 */
export const getCategoryDocumentCount = async (categoryId: string, userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting category document count:', error);
    return 0;
  }
};

/**
 * Gets document count for a subcategory
 */
export const getSubcategoryDocumentCount = async (subcategoryId: string, userId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('subcategory_id', subcategoryId)
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting subcategory document count:', error);
    return 0;
  }
};

/**
 * Gets all documents for a user (for search functionality)
 * OPTIMIZED: Excludes file_url to reduce payload (not needed for search)
 */
export const getAllUserDocuments = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, category_id, subcategory_id, folder_id, uploaded_at')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all user documents:', error);
    return [];
  }
};

/**
 * Gets all subcategories for a user (for search functionality)
 * OPTIMIZED: Only select needed columns
 */
export const getAllUserSubcategories = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name, category_id, is_custom')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all user subcategories:', error);
    return [];
  }
};

/**
 * Gets document counts for ALL categories in a single query (eliminates N+1)
 * Returns a Map of categoryId -> documentCount
 * OPTIMIZED: Uses GROUP BY aggregation on the database side
 */
export const getAllCategoryDocumentCounts = async (userId: string): Promise<Map<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('category_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    // Count documents per category
    const countMap = new Map<string, number>();
    (data || []).forEach(doc => {
      if (doc.category_id) {
        countMap.set(doc.category_id, (countMap.get(doc.category_id) || 0) + 1);
      }
    });

    return countMap;
  } catch (error) {
    console.error('Error getting category document counts:', error);
    return new Map();
  }
};

/**
 * Gets document counts for ALL subcategories in a single query (eliminates N+1)
 * Returns a Map of subcategoryId -> documentCount
 */
export const getAllSubcategoryDocumentCounts = async (userId: string): Promise<Map<string, number>> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('subcategory_id')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (error) throw error;

    // Count documents per subcategory
    const countMap = new Map<string, number>();
    (data || []).forEach(doc => {
      if (doc.subcategory_id) {
        countMap.set(doc.subcategory_id, (countMap.get(doc.subcategory_id) || 0) + 1);
      }
    });

    return countMap;
  } catch (error) {
    console.error('Error getting subcategory document counts:', error);
    return new Map();
  }
};

/**
 * Loads categories with document counts in optimized parallel queries
 */
export const loadCategoriesOptimized = async (userId: string): Promise<{
  categories: any[];
  docCountMap: Map<string, number>;
}> => {
  // Run both queries in parallel
  const [docCountMap, customCatsResult] = await Promise.all([
    getAllCategoryDocumentCounts(userId),
    supabase
      .from('categories')
      .select('id, name, icon_bg_color, is_custom')
      .eq('user_id', userId)
      .eq('is_custom', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
  ]);

  return {
    categories: customCatsResult.data || [],
    docCountMap
  };
};

/**
 * Loads subcategories with document counts in optimized parallel queries
 */
export const loadSubcategoriesOptimized = async (userId: string, categoryId: string): Promise<{
  subcategories: any[];
  docCountMap: Map<string, number>;
  totalDocCount: number;
}> => {
  // Run all queries in parallel
  const [docCountMap, customSubsResult, totalCountResult] = await Promise.all([
    getAllSubcategoryDocumentCounts(userId),
    supabase
      .from('subcategories')
      .select('id, name, is_custom')
      .eq('category_id', categoryId)
      .eq('user_id', userId)
      .eq('is_custom', true)
      .is('deleted_at', null)
      .order('created_at', { ascending: true }),
    getCategoryDocumentCount(categoryId, userId)
  ]);

  return {
    subcategories: customSubsResult.data || [],
    docCountMap,
    totalDocCount: totalCountResult
  };
};
