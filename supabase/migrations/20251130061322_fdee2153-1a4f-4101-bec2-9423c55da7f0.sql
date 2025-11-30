-- Add app lock and 2FA columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS app_lock_type TEXT DEFAULT NULL CHECK (app_lock_type IN ('biometric', 'pin', 'password', NULL)),
ADD COLUMN IF NOT EXISTS app_pin_hash TEXT DEFAULT NULL;

-- Create two_fa_verifications table for email-based 2FA
CREATE TABLE IF NOT EXISTS public.two_fa_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on two_fa_verifications
ALTER TABLE public.two_fa_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for two_fa_verifications
CREATE POLICY "Users can view own 2FA verifications"
  ON public.two_fa_verifications
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert 2FA verifications"
  ON public.two_fa_verifications
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "System can update 2FA verifications"
  ON public.two_fa_verifications
  FOR UPDATE
  TO public
  USING (true);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_two_fa_verifications_user_id ON public.two_fa_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_two_fa_verifications_expires_at ON public.two_fa_verifications(expires_at);