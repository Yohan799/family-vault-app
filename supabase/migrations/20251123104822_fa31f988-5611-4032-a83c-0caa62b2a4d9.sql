-- Create nominees table
CREATE TABLE public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  relation TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified')),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Enable RLS on nominees
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own nominees
CREATE POLICY "Users can view own nominees"
  ON public.nominees
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policy: Users can insert their own nominees
CREATE POLICY "Users can insert own nominees"
  ON public.nominees
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own nominees
CREATE POLICY "Users can update own nominees"
  ON public.nominees
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policy: Users can soft delete their own nominees
CREATE POLICY "Users can delete own nominees"
  ON public.nominees
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create time_capsules table
CREATE TABLE public.time_capsules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  phone TEXT,
  release_date DATE NOT NULL,
  attachment_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'released')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ
);

-- Enable RLS on time_capsules
ALTER TABLE public.time_capsules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own time capsules
CREATE POLICY "Users can view own time capsules"
  ON public.time_capsules
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policy: Users can insert their own time capsules
CREATE POLICY "Users can insert own time capsules"
  ON public.time_capsules
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own time capsules
CREATE POLICY "Users can update own time capsules"
  ON public.time_capsules
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on time capsules
CREATE TRIGGER update_time_capsules_updated_at
  BEFORE UPDATE ON public.time_capsules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT,
  icon_bg_color TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own categories
CREATE POLICY "Users can view own categories"
  ON public.categories
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policy: Users can insert their own categories
CREATE POLICY "Users can insert own categories"
  ON public.categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own categories
CREATE POLICY "Users can update own categories"
  ON public.categories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create documents table (simplified for now, will expand in Phase 3)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own documents
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS Policy: Users can insert their own documents
CREATE POLICY "Users can insert own documents"
  ON public.documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own documents
CREATE POLICY "Users can update own documents"
  ON public.documents
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create inactivity_triggers table
CREATE TABLE public.inactivity_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT false,
  inactive_days_threshold INTEGER DEFAULT 7,
  custom_message TEXT,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on inactivity_triggers
ALTER TABLE public.inactivity_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own inactivity trigger
CREATE POLICY "Users can view own inactivity trigger"
  ON public.inactivity_triggers
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own inactivity trigger
CREATE POLICY "Users can insert own inactivity trigger"
  ON public.inactivity_triggers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own inactivity trigger
CREATE POLICY "Users can update own inactivity trigger"
  ON public.inactivity_triggers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at on inactivity_triggers
CREATE TRIGGER update_inactivity_triggers_updated_at
  BEFORE UPDATE ON public.inactivity_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();