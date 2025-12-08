-- Add attempt_count column to two_fa_verifications table for brute-force protection
ALTER TABLE public.two_fa_verifications 
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0;