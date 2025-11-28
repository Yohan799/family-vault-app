-- Create security definer function for nominee soft delete with cascade cleanup
CREATE OR REPLACE FUNCTION public.soft_delete_nominee(
  _nominee_id uuid,
  _user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- First verify the user owns this nominee
  IF NOT EXISTS (
    SELECT 1 FROM public.nominees 
    WHERE id = _nominee_id AND user_id = _user_id AND deleted_at IS NULL
  ) THEN
    RETURN false;
  END IF;
  
  -- Delete related verification tokens
  DELETE FROM public.verification_tokens WHERE nominee_id = _nominee_id;
  
  -- Delete related access controls
  DELETE FROM public.access_controls WHERE nominee_id = _nominee_id AND user_id = _user_id;
  
  -- Perform the soft delete
  UPDATE public.nominees 
  SET deleted_at = NOW() 
  WHERE id = _nominee_id AND user_id = _user_id;
  
  RETURN true;
END;
$$;

-- Add missing DELETE policy for verification_tokens
CREATE POLICY "Users can delete own nominee verification tokens"
ON public.verification_tokens
FOR DELETE
USING (public.is_user_nominee(nominee_id, auth.uid()));