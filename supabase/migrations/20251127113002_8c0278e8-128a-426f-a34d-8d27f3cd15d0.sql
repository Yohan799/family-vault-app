-- Fix UPDATE policy for documents table to allow soft deletes
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;

-- Create UPDATE policy with explicit WITH CHECK clause
CREATE POLICY "Users can update own documents" 
ON public.documents 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);