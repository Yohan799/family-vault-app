-- Create quick_actions table
CREATE TABLE IF NOT EXISTS public.quick_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  route TEXT,
  is_enabled BOOLEAN DEFAULT true,
  is_custom BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, action_key)
);

-- Enable RLS
ALTER TABLE public.quick_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own quick actions"
ON public.quick_actions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_quick_actions_updated_at
BEFORE UPDATE ON public.quick_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();