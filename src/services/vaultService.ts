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

    // If user already has default categories, skip sync
    if (existingCategories && existingCategories.length > 0) {
      return;
    }

    // Insert default categories
    for (const template of vaultCategories) {
      const { data: category, error: catError } = await supabase
        .from('categories')
        .insert({
          id: template.id,
          user_id: userId,
          name: template.name,
          icon: template.icon.name || 'Folder',
          icon_bg_color: template.iconBgColor,
          is_custom: false
        })
        .select()
        .single();

      if (catError) {
        console.error(`Error inserting category ${template.name}:`, catError);
        continue;
      }

      // Insert subcategories for this category
      if (template.subcategories && template.subcategories.length > 0) {
        const subcategoriesToInsert = template.subcategories.map(sub => ({
          id: sub.id,
          user_id: userId,
          category_id: template.id,
          name: sub.name,
          icon: sub.icon.name || 'Folder',
          is_custom: false
        }));

        const { error: subError } = await supabase
          .from('subcategories')
          .insert(subcategoriesToInsert);

        if (subError) {
          console.error(`Error inserting subcategories for ${template.name}:`, subError);
        }
      }
    }
  } catch (error) {
    console.error('Error syncing default categories:', error);
    throw error;
  }
};

/**
 * Soft-deletes a category and cascades to all related entities
 */
export const deleteCategoryWithCascade = async (categoryId: string, userId: string): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Soft delete the category
    const { error: catError } = await supabase
      .from('categories')
      .update({ deleted_at: now })
      .eq('id', categoryId)
      .eq('user_id', userId);

    if (catError) throw catError;

    // Soft delete all subcategories in this category
    const { error: subError } = await supabase
      .from('subcategories')
      .update({ deleted_at: now })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (subError) console.warn('Error deleting subcategories:', subError);

    // Soft delete all folders in this category
    const { error: folderError } = await supabase
      .from('folders')
      .update({ deleted_at: now })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (folderError) console.warn('Error deleting folders:', folderError);

    // Soft delete all documents in this category
    const { error: docError } = await supabase
      .from('documents')
      .update({ deleted_at: now })
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (docError) console.warn('Error deleting documents:', docError);
  } catch (error) {
    console.error('Error deleting category with cascade:', error);
    throw error;
  }
};

/**
 * Soft-deletes a subcategory and cascades to all related entities
 */
export const deleteSubcategoryWithCascade = async (
  subcategoryId: string,
  categoryId: string,
  userId: string
): Promise<void> => {
  try {
    const now = new Date().toISOString();

    // Soft delete the subcategory
    const { error: subError } = await supabase
      .from('subcategories')
      .update({ deleted_at: now })
      .eq('id', subcategoryId)
      .eq('category_id', categoryId)
      .eq('user_id', userId);

    if (subError) throw subError;

    // Soft delete all folders in this subcategory
    const { error: folderError } = await supabase
      .from('folders')
      .update({ deleted_at: now })
      .eq('subcategory_id', subcategoryId)
      .eq('user_id', userId);

    if (folderError) console.warn('Error deleting folders:', folderError);

    // Soft delete all documents in this subcategory
    const { error: docError } = await supabase
      .from('documents')
      .update({ deleted_at: now })
      .eq('subcategory_id', subcategoryId)
      .eq('user_id', userId);

    if (docError) console.warn('Error deleting documents:', docError);
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
