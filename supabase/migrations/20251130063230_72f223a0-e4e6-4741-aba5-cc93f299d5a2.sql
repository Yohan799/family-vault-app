-- Add additional_emails field to profiles table to store array of email addresses
ALTER TABLE public.profiles 
ADD COLUMN additional_emails jsonb DEFAULT '[]'::jsonb;