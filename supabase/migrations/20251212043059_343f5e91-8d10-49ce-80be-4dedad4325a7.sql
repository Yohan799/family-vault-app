-- Drop the existing UPDATE policy and recreate with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own folders" ON public.folders;

-- Recreate UPDATE policy with WITH CHECK for soft deletes
CREATE POLICY "Users can update own folders" 
ON public.folders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure the DELETE policy exists (for hard deletes if needed)
DROP POLICY IF EXISTS "Users can delete own folders" ON public.folders;
CREATE POLICY "Users can delete own folders" 
ON public.folders 
FOR DELETE 
USING (auth.uid() = user_id);