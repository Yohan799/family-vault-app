-- Fix type mismatch: Change access_controls.resource_id from UUID to TEXT
-- This allows it to reference categories/subcategories/folders (TEXT) and documents (UUID cast to TEXT)
ALTER TABLE public.access_controls 
  ALTER COLUMN resource_id TYPE text USING resource_id::text;

-- Recreate soft_delete_category function with proper TEXT handling
CREATE OR REPLACE FUNCTION public.soft_delete_category(_category_id text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _now timestamp with time zone := NOW();
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.categories 
    WHERE id = _category_id AND user_id = _user_id AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- Delete all access controls for documents, folders, subcategories, and category itself
  DELETE FROM public.access_controls 
  WHERE user_id = _user_id 
    AND (
      (resource_type = 'category' AND resource_id = _category_id)
      OR (resource_type = 'subcategory' AND resource_id IN (
        SELECT id FROM public.subcategories WHERE category_id = _category_id AND user_id = _user_id
      ))
      OR (resource_type = 'folder' AND resource_id IN (
        SELECT id FROM public.folders WHERE category_id = _category_id AND user_id = _user_id
      ))
      OR (resource_type = 'document' AND resource_id IN (
        SELECT id::text FROM public.documents WHERE category_id = _category_id AND user_id = _user_id
      ))
    );
  
  -- Soft delete all documents in this category
  UPDATE public.documents 
  SET deleted_at = _now 
  WHERE category_id = _category_id AND user_id = _user_id AND deleted_at IS NULL;
  
  -- Soft delete all folders in this category
  UPDATE public.folders 
  SET deleted_at = _now 
  WHERE category_id = _category_id AND user_id = _user_id AND deleted_at IS NULL;
  
  -- Soft delete all subcategories in this category
  UPDATE public.subcategories 
  SET deleted_at = _now 
  WHERE category_id = _category_id AND user_id = _user_id AND deleted_at IS NULL;
  
  -- Soft delete the category itself
  UPDATE public.categories 
  SET deleted_at = _now 
  WHERE id = _category_id AND user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Recreate soft_delete_subcategory function with proper TEXT handling
CREATE OR REPLACE FUNCTION public.soft_delete_subcategory(_subcategory_id text, _category_id text, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _now timestamp with time zone := NOW();
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.subcategories 
    WHERE id = _subcategory_id 
      AND category_id = _category_id 
      AND user_id = _user_id 
      AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- Delete all access controls for documents, folders, and subcategory itself
  DELETE FROM public.access_controls 
  WHERE user_id = _user_id 
    AND (
      (resource_type = 'subcategory' AND resource_id = _subcategory_id)
      OR (resource_type = 'folder' AND resource_id IN (
        SELECT id FROM public.folders WHERE subcategory_id = _subcategory_id AND user_id = _user_id
      ))
      OR (resource_type = 'document' AND resource_id IN (
        SELECT id::text FROM public.documents WHERE subcategory_id = _subcategory_id AND user_id = _user_id
      ))
    );
  
  -- Soft delete all documents in this subcategory
  UPDATE public.documents 
  SET deleted_at = _now 
  WHERE subcategory_id = _subcategory_id AND user_id = _user_id AND deleted_at IS NULL;
  
  -- Soft delete all folders in this subcategory
  UPDATE public.folders 
  SET deleted_at = _now 
  WHERE subcategory_id = _subcategory_id AND user_id = _user_id AND deleted_at IS NULL;
  
  -- Soft delete the subcategory itself
  UPDATE public.subcategories 
  SET deleted_at = _now 
  WHERE id = _subcategory_id AND user_id = _user_id;
  
  RETURN true;
END;
$$;