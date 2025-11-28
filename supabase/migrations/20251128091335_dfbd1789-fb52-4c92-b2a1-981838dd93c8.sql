-- Fix documents UPDATE policy (remove WITH CHECK clause)
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents
FOR UPDATE TO public
USING (auth.uid() = user_id);

-- Add UPDATE policy for subcategories (for soft delete)
DROP POLICY IF EXISTS "Users can update own subcategories" ON public.subcategories;
CREATE POLICY "Users can update own subcategories" ON public.subcategories
FOR UPDATE TO public
USING (auth.uid() = user_id);

-- Add UPDATE policy for folders (for soft delete)
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;
CREATE POLICY "Users can update own folders" ON public.folders
FOR UPDATE TO public
USING (auth.uid() = user_id);