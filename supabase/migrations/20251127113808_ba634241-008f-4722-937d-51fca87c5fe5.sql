-- Fix UPDATE policy for nominees table to allow soft deletes
DROP POLICY IF EXISTS "Users can update own nominees" ON public.nominees;

-- Create UPDATE policy with explicit WITH CHECK clause
CREATE POLICY "Users can update own nominees" 
ON public.nominees 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);