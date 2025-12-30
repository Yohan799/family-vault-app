-- Add folder_type and styling columns to folders table for document grouping feature
-- This enables groups (like "Family Documents", "Son's Medical") with icons/colors

-- Add folder_type column to distinguish regular folders from groups
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS folder_type TEXT DEFAULT 'folder' CHECK (folder_type IN ('folder', 'group'));

-- Add icon and color columns for group styling (similar to subcategories)
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS icon_bg_color TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for faster queries on folder_type
CREATE INDEX IF NOT EXISTS idx_folders_folder_type ON public.folders(folder_type);

-- Create index for querying folders by subcategory
CREATE INDEX IF NOT EXISTS idx_folders_subcategory ON public.folders(subcategory_id) WHERE deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.folders.folder_type IS 'Type of folder: folder (regular) or group (document group with access control)';
COMMENT ON COLUMN public.folders.icon IS 'Lucide icon name for group display';
COMMENT ON COLUMN public.folders.icon_bg_color IS 'Background color for group icon (tailwind class or hex)';
COMMENT ON COLUMN public.folders.description IS 'Optional description for the group';
