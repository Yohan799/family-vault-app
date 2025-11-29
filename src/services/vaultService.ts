import { supabase } from "@/integrations/supabase/client";
import { vaultCategories } from "@/data/vaultCategories";

/**
 * Syncs default categories and subcategories from vaultCategories template
 * into the database for the current user (idempotent - only creates if missing)
 */
export const syncDefaultCategories = async (userId: string): Promise<void> => {
  try {
    // Check if user already has default categories synced
    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('is_custom', false);

    // If user already has default categories, skip category sync but still check subcategories
    const shouldSyncCategories = !existingCategories || existingCategories.length === 0;

    // Sync default categories
    for (const template of vaultCategories) {
      // Insert category if not exists
      if (shouldSyncCategories) {
        const { error: catError } = await supabase
          .from('categories')
          .insert({
            id: template.id,
            user_id: userId,
            name: template.name,
            icon: template.icon.name || 'Folder',
            icon_bg_color: template.iconBgColor,
            is_custom: false
          });

        if (catError && catError.code !== '23505') { // Ignore duplicate key errors
          console.error(`Error inserting category ${template.name}:`, catError);
          continue;
        }
      }

      // Always ensure all subcategories are synced (fixes missing Personal subcategories issue)
      if (template.subcategories && template.subcategories.length > 0) {
        // Check which subcategories already exist
        const { data: existingSubs } = await supabase
          .from('subcategories')
          .select('id')
          .eq('category_id', template.id)
          .eq('user_id', userId)
          .eq('is_custom', false);

        const existingSubIds = new Set((existingSubs || []).map(s => s.id));

        // Insert only missing subcategories
        const missingSubcategories = template.subcategories
          .filter(sub => !existingSubIds.has(sub.id))
          .map(sub => ({
            id: sub.id,
            user_id: userId,
            category_id: template.id,
            name: sub.name,
            icon: sub.icon.name || 'Folder',
            is_custom: false
          }));

        if (missingSubcategories.length > 0) {
          const { error: subError } = await supabase
            .from('subcategories')
            .insert(missingSubcategories);

          if (subError && subError.code !== '23505') { // Ignore duplicate key errors
            console.error(`Error inserting subcategories for ${template.name}:`, subError);
          }
        }
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
 * Gets document count for a category
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
 */
export const getAllUserDocuments = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
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
 */
export const getAllUserSubcategories = async (userId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
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
