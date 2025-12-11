-- Create signup_verification_tokens table
CREATE TABLE public.signup_verification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.signup_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_signup_tokens_token ON public.signup_verification_tokens(token);
CREATE INDEX idx_signup_tokens_user_id ON public.signup_verification_tokens(user_id);
CREATE INDEX idx_signup_tokens_email ON public.signup_verification_tokens(email);

-- Add email_verified column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;