-- ============================================
-- MIGRATION: Add category_id to sub_chapters
-- ============================================
-- Migration ini menambahkan category_id ke sub_chapters sesuai dengan
-- perubahan struktur di PANDUAN_INPUT_DATA.md
-- 
-- Perubahan:
-- - Tryout TIDAK perlu category_id lagi (hanya butuh package_id)
-- - Sub-Chapter WAJIB punya category_id
-- - Questions bisa punya category_id (OPSIONAL) untuk filtering

-- ============================================
-- 1. Add category_id column to sub_chapters
-- ============================================
DO $$ 
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'sub_chapters' 
    AND column_name = 'category_id'
  ) THEN
    -- Add category_id column (nullable first, then we'll make it required)
    ALTER TABLE public.sub_chapters 
    ADD COLUMN category_id uuid;
    
    -- Add foreign key constraint
    ALTER TABLE public.sub_chapters
    ADD CONSTRAINT sub_chapters_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.categories(id);
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_sub_chapters_category_id 
    ON public.sub_chapters(category_id);
    
    RAISE NOTICE 'Added category_id column to sub_chapters';
  ELSE
    RAISE NOTICE 'Column category_id already exists in sub_chapters';
  END IF;
END $$;

-- ============================================
-- 2. Update existing sub_chapters (if any)
-- ============================================
-- Jika ada sub_chapters yang sudah ada, kita perlu assign category_id
-- Untuk saat ini, kita bisa set NULL atau assign ke category pertama yang ada
-- Admin harus update manual via UI

-- ============================================
-- 3. Make category_id NOT NULL (optional - uncomment jika ingin enforce)
-- ============================================
-- WARNING: Jangan uncomment ini jika masih ada sub_chapters dengan category_id NULL
-- 
-- ALTER TABLE public.sub_chapters
-- ALTER COLUMN category_id SET NOT NULL;

-- ============================================
-- 4. Verify migration
-- ============================================
-- Run this query to verify:
-- SELECT 
--   column_name, 
--   data_type, 
--   is_nullable
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'sub_chapters' 
--   AND column_name = 'category_id';

