-- Add DELETE policy for folders table (for soft delete operations)
CREATE POLICY "Users can delete own folders"
ON public.folders
FOR DELETE
USING (auth.uid() = user_id);