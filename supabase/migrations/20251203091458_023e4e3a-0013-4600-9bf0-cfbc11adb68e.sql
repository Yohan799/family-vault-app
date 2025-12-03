-- Create device_tokens table for FCM push notifications
CREATE TABLE public.device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'android',
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own device tokens"
ON public.device_tokens FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device tokens"
ON public.device_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own device tokens"
ON public.device_tokens FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own device tokens"
ON public.device_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Add push_notifications_enabled to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT false;