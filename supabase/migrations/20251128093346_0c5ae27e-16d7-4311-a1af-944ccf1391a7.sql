-- Security definer function to soft delete documents with cascade cleanup
CREATE OR REPLACE FUNCTION public.soft_delete_document(_document_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify ownership
  IF NOT EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = _document_id AND user_id = _user_id AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- Delete related access controls
  DELETE FROM public.access_controls 
  WHERE resource_type = 'document' 
    AND resource_id = _document_id::text 
    AND user_id = _user_id;
  
  -- Soft delete the document
  UPDATE public.documents 
  SET deleted_at = NOW() 
  WHERE id = _document_id AND user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Security definer function to soft delete categories with full cascade cleanup
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

-- Security definer function to soft delete subcategories with cascade cleanup
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