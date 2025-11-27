-- Fix UPDATE policy to allow soft deletes (setting deleted_at)
DROP POLICY IF EXISTS "Users can update own nominees" ON public.nominees;

-- Create UPDATE policy with explicit WITH CHECK clause that allows soft deletes
CREATE POLICY "Users can update own nominees" 
ON public.nominees 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);