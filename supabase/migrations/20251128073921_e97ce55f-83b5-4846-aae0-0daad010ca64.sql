-- Phase 1: Add emergency access fields to inactivity_triggers
ALTER TABLE public.inactivity_triggers 
ADD COLUMN IF NOT EXISTS emergency_access_granted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS emergency_granted_at timestamp with time zone;

-- Create inactivity_alerts table for alert history
CREATE TABLE IF NOT EXISTS public.inactivity_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_stage text NOT NULL CHECK (alert_stage IN ('user_warning', 'nominee_warning', 'emergency_granted')),
  inactive_days integer NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  recipient_type text NOT NULL CHECK (recipient_type IN ('user', 'nominee')),
  recipient_email text,
  custom_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on inactivity_alerts
ALTER TABLE public.inactivity_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for inactivity_alerts
CREATE POLICY "Users can view own alerts"
ON public.inactivity_alerts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert alerts"
ON public.inactivity_alerts
FOR INSERT
WITH CHECK (true);

-- Create otp_verifications table for nominee emergency access
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_email text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  verified_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS on otp_verifications
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for otp_verifications
CREATE POLICY "System can manage OTP verifications"
ON public.otp_verifications
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for efficient inactive user lookups
CREATE INDEX IF NOT EXISTS idx_inactivity_triggers_active_users 
ON public.inactivity_triggers(user_id, is_active, last_activity_at) 
WHERE is_active = true;

-- Create index for OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_expires 
ON public.otp_verifications(nominee_email, expires_at, verified_at);

-- Create index for alert history
CREATE INDEX IF NOT EXISTS idx_inactivity_alerts_user_sent 
ON public.inactivity_alerts(user_id, sent_at DESC);