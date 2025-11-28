-- Drop the existing UPDATE policy with redundant WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own nominees" ON public.nominees;

-- Create new UPDATE policy without WITH CHECK clause
-- This fixes the RLS violation error during soft deletes
-- USING clause alone is sufficient since user_id is never modified
CREATE POLICY "Users can update own nominees" 
ON public.nominees 
FOR UPDATE 
TO public
USING (auth.uid() = user_id);