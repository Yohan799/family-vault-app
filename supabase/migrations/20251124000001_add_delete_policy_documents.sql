-- Add DELETE policy for documents table to allow hard delete
CREATE POLICY "Users can delete own documents"
ON public.documents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
