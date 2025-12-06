-- Create notifications table for in-app notification history
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    data JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX notifications_is_read_idx ON public.notifications(is_read);