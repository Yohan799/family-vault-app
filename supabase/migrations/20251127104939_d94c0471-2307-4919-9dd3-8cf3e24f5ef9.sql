-- Create verification_tokens table for nominee email verification
CREATE TABLE IF NOT EXISTS public.verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_id uuid NOT NULL REFERENCES public.nominees(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view verification tokens for their own nominees
CREATE POLICY "Users can view own nominee verification tokens"
ON public.verification_tokens
FOR SELECT
USING (
  nominee_id IN (
    SELECT id FROM public.nominees WHERE user_id = auth.uid()
  )
);

-- Users can insert verification tokens for their own nominees
CREATE POLICY "Users can insert own nominee verification tokens"
ON public.verification_tokens
FOR INSERT
WITH CHECK (
  nominee_id IN (
    SELECT id FROM public.nominees WHERE user_id = auth.uid()
  )
);

-- Users can update verification tokens for their own nominees
CREATE POLICY "Users can update own nominee verification tokens"
ON public.verification_tokens
FOR UPDATE
USING (
  nominee_id IN (
    SELECT id FROM public.nominees WHERE user_id = auth.uid()
  )
);

-- Create index for faster token lookups
CREATE INDEX idx_verification_tokens_token ON public.verification_tokens(token);
CREATE INDEX idx_verification_tokens_nominee_id ON public.verification_tokens(nominee_id);