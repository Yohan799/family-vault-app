-- Complete fix for vault schema to support string-based IDs instead of UUIDs
-- The app uses string slugs like "real-estate", "residential", etc.

-- Step 1: Drop all foreign key constraints
ALTER TABLE public.documents 
  DROP CONSTRAINT IF EXISTS documents_category_id_fkey,
  DROP CONSTRAINT IF EXISTS documents_subcategory_id_fkey,
  DROP CONSTRAINT IF EXISTS documents_folder_id_fkey;

ALTER TABLE public.folders
  DROP CONSTRAINT IF EXISTS folders_category_id_fkey,
  DROP CONSTRAINT IF EXISTS folders_subcategory_id_fkey,
  DROP CONSTRAINT IF EXISTS folders_parent_folder_id_fkey;

ALTER TABLE public.subcategories
  DROP CONSTRAINT IF EXISTS subcategories_category_id_fkey;

ALTER TABLE public.access_controls
  DROP CONSTRAINT IF EXISTS access_controls_nominee_id_fkey;

-- Step 2: Change categories table ID to TEXT
ALTER TABLE public.categories
  ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Step 3: Change subcategories table columns to TEXT
ALTER TABLE public.subcategories
  ALTER COLUMN id TYPE TEXT USING id::TEXT,
  ALTER COLUMN category_id TYPE TEXT USING category_id::TEXT;

-- Step 4: Change folders table columns to TEXT
ALTER TABLE public.folders
  ALTER COLUMN id TYPE TEXT USING id::TEXT,
  ALTER COLUMN category_id TYPE TEXT USING category_id::TEXT,
  ALTER COLUMN subcategory_id TYPE TEXT USING subcategory_id::TEXT,
  ALTER COLUMN parent_folder_id TYPE TEXT USING parent_folder_id::TEXT;

-- Step 5: Change documents table columns to TEXT
ALTER TABLE public.documents
  ALTER COLUMN category_id TYPE TEXT USING category_id::TEXT,
  ALTER COLUMN subcategory_id TYPE TEXT USING subcategory_id::TEXT,
  ALTER COLUMN folder_id TYPE TEXT USING folder_id::TEXT;

-- Note: We do NOT recreate foreign key constraints since the app uses
-- predefined string slugs from vaultCategories.ts, not database records