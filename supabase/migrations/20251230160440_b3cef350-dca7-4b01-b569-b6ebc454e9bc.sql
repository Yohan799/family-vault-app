-- Add folder_type column to distinguish regular folders from groups
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS folder_type TEXT DEFAULT 'folder' CHECK (folder_type IN ('folder', 'group'));

-- Add icon and color columns for group styling
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS icon TEXT,
ADD COLUMN IF NOT EXISTS icon_bg_color TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_folders_folder_type ON public.folders(folder_type);
CREATE INDEX IF NOT EXISTS idx_folders_subcategory ON public.folders(subcategory_id) WHERE deleted_at IS NULL;

-- Add documentation comments
COMMENT ON COLUMN public.folders.folder_type IS 'Type of folder: folder (regular) or group (document group with access control)';
COMMENT ON COLUMN public.folders.icon IS 'Lucide icon name for group display';
COMMENT ON COLUMN public.folders.icon_bg_color IS 'Background color for group icon (tailwind class or hex)';
COMMENT ON COLUMN public.folders.description IS 'Optional description for the group';