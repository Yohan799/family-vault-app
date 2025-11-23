-- Add DELETE policy to categories table
CREATE POLICY "Users can delete own categories"
ON categories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);