-- Create a security definer function for soft-deleting time capsules
CREATE OR REPLACE FUNCTION public.soft_delete_time_capsule(_capsule_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  capsule_exists boolean;
BEGIN
  -- Check if capsule exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.time_capsules 
    WHERE id = _capsule_id 
      AND user_id = _user_id 
      AND deleted_at IS NULL
  ) INTO capsule_exists;

  IF NOT capsule_exists THEN
    RETURN false;
  END IF;

  -- Soft delete the capsule
  UPDATE public.time_capsules
  SET deleted_at = NOW(), updated_at = NOW()
  WHERE id = _capsule_id AND user_id = _user_id;

  RETURN true;
END;
$$;