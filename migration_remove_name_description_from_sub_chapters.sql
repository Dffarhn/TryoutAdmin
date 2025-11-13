-- Migration: Remove name and description columns from sub_chapters table
-- Since each category can only be used once per tryout, sub-chapter is identified by category
-- Therefore, name and description columns are no longer needed

-- Step 1: Backup existing data (optional but recommended)
-- CREATE TABLE sub_chapters_backup AS SELECT * FROM sub_chapters;

-- Step 2: Verify all sub-chapters have category_id
-- SELECT id, tryout_id, name, category_id 
-- FROM sub_chapters 
-- WHERE category_id IS NULL;
-- If any rows returned, fix them before proceeding

-- Step 3: Drop columns from sub_chapters table
ALTER TABLE public.sub_chapters
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description;

-- Step 4: Add unique constraint to ensure one category per tryout
-- This ensures that each category can only be used once per tryout
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'sub_chapters_tryout_category_unique'
  ) THEN
    ALTER TABLE public.sub_chapters
      ADD CONSTRAINT sub_chapters_tryout_category_unique 
      UNIQUE (tryout_id, category_id);
  END IF;
END $$;

-- Verification queries (run after migration):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'sub_chapters'
-- ORDER BY ordinal_position;

-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'sub_chapters';

-- Notes:
-- 1. This migration assumes that:
--    - All existing sub-chapters have been migrated to use category_id
--    - The application code has been updated to use categoryName instead of name
--    - No foreign key constraints or indexes depend on these columns
-- 2. The unique constraint prevents duplicate category usage per tryout
-- 3. If you need to rollback, restore from backup and add columns back

