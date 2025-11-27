-- Fix RLS policies for nominees to properly support soft deletes
-- Drop existing policies
DROP POLICY IF EXISTS "Users can delete own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can update own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can view own nominees" ON public.nominees;
DROP POLICY IF EXISTS "Users can insert own nominees" ON public.nominees;

-- Recreate policies with proper soft delete support
CREATE POLICY "Users can view own nominees" 
ON public.nominees 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own nominees" 
ON public.nominees 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nominees" 
ON public.nominees 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add index for better performance on deleted_at queries
CREATE INDEX IF NOT EXISTS idx_nominees_deleted_at ON public.nominees(deleted_at) WHERE deleted_at IS NULL;