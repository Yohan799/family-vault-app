-- Drop existing SELECT policy with deleted_at filter that causes RLS violation on soft-delete
DROP POLICY IF EXISTS "Users can view own folders" ON public.folders;

-- Recreate SELECT policy without deleted_at filter
-- Application code already filters deleted_at IS NULL in all folder queries
CREATE POLICY "Users can view own folders"
ON public.folders FOR SELECT
USING (auth.uid() = user_id);