-- Performance Optimization: Add indexes on frequently queried columns

-- Documents table indexes
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON public.documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_subcategory_id ON public.documents(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder_id ON public.documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_deleted ON public.documents(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_documents_user_category ON public.documents(user_id, category_id) WHERE deleted_at IS NULL;

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_deleted ON public.categories(user_id, deleted_at);

-- Subcategories table indexes
CREATE INDEX IF NOT EXISTS idx_subcategories_user_id ON public.subcategories(user_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON public.subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_user_deleted ON public.subcategories(user_id, deleted_at);

-- Folders table indexes
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_subcategory_id ON public.folders(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_folders_category_id ON public.folders(category_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_deleted ON public.folders(user_id, deleted_at);

-- Nominees table indexes (for access control queries)
CREATE INDEX IF NOT EXISTS idx_nominees_user_id ON public.nominees(user_id);
CREATE INDEX IF NOT EXISTS idx_nominees_user_deleted ON public.nominees(user_id, deleted_at);

-- Access controls table indexes
CREATE INDEX IF NOT EXISTS idx_access_controls_user_id ON public.access_controls(user_id);
CREATE INDEX IF NOT EXISTS idx_access_controls_nominee_id ON public.access_controls(nominee_id);
CREATE INDEX IF NOT EXISTS idx_access_controls_resource ON public.access_controls(resource_type, resource_id);