-- Add avatar_url column to nominees table
ALTER TABLE public.nominees
ADD COLUMN avatar_url TEXT DEFAULT NULL;