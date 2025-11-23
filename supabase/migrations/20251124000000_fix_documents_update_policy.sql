-- Fix UPDATE policy for documents table to allow soft delete
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;

-- Create new UPDATE policy with WITH CHECK clause
CREATE POLICY "Users can update own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
