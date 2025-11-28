-- Create security definer function to check if nominee belongs to user
-- This prevents RLS recursion issues with nested queries
CREATE OR REPLACE FUNCTION public.is_user_nominee(_nominee_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nominees
    WHERE id = _nominee_id
      AND user_id = _user_id
      AND deleted_at IS NULL
  )
$$;

-- Drop existing verification_tokens RLS policies
DROP POLICY IF EXISTS "Users can view own nominee verification tokens" ON public.verification_tokens;
DROP POLICY IF EXISTS "Users can insert own nominee verification tokens" ON public.verification_tokens;
DROP POLICY IF EXISTS "Users can update own nominee verification tokens" ON public.verification_tokens;

-- Create new policies using the security definer function
CREATE POLICY "Users can view own nominee verification tokens"
ON public.verification_tokens
FOR SELECT
TO public
USING (public.is_user_nominee(nominee_id, auth.uid()));

CREATE POLICY "Users can insert own nominee verification tokens"
ON public.verification_tokens
FOR INSERT
TO public
WITH CHECK (public.is_user_nominee(nominee_id, auth.uid()));

CREATE POLICY "Users can update own nominee verification tokens"
ON public.verification_tokens
FOR UPDATE
TO public
USING (public.is_user_nominee(nominee_id, auth.uid()));