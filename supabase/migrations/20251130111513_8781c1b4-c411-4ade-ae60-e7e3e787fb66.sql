-- Fix critical RLS policy vulnerabilities on OTP and 2FA verification tables
-- These policies allow any authenticated user to read/write ALL verification codes
-- Edge functions use service_role_key which bypasses RLS, so these policies are unnecessary

-- Fix otp_verifications: Remove overly permissive ALL policy
DROP POLICY IF EXISTS "System can manage OTP verifications" ON public.otp_verifications;

-- Fix two_fa_verifications: Remove overly permissive INSERT policy  
DROP POLICY IF EXISTS "System can insert 2FA verifications" ON public.two_fa_verifications;

-- Fix two_fa_verifications: Remove overly permissive UPDATE policy
DROP POLICY IF EXISTS "System can update 2FA verifications" ON public.two_fa_verifications;

-- Note: The "Users can view own 2FA verifications" SELECT policy remains (properly scoped to user_id)
-- Edge functions will continue to work normally using service_role_key which bypasses RLS