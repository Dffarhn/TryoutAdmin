-- ============================================
-- MIGRATION: Fix admin_activity_logs foreign key
-- ============================================
-- Perbaiki foreign key constraint admin_activity_logs.admin_id
-- dari admin_profiles(id) ke admins(id)

-- ============================================
-- 1. Drop existing foreign key constraint
-- ============================================
DO $$ 
BEGIN
  -- Drop constraint jika ada
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_activity_logs_admin_id_fkey' 
    AND table_name = 'admin_activity_logs'
  ) THEN
    ALTER TABLE public.admin_activity_logs 
    DROP CONSTRAINT admin_activity_logs_admin_id_fkey;
    
    RAISE NOTICE 'Dropped existing admin_activity_logs_admin_id_fkey constraint';
  ELSE
    RAISE NOTICE 'Constraint admin_activity_logs_admin_id_fkey does not exist';
  END IF;
END $$;

-- ============================================
-- 2. Add new foreign key constraint to admins table
-- ============================================
DO $$ 
BEGIN
  -- Check if admins table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'admins'
  ) THEN
    -- Add foreign key constraint to admins table
    ALTER TABLE public.admin_activity_logs
    ADD CONSTRAINT admin_activity_logs_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added admin_activity_logs_admin_id_fkey constraint to admins table';
  ELSE
    RAISE NOTICE 'WARNING: admins table does not exist!';
  END IF;
END $$;

-- ============================================
-- 3. Verify migration
-- ============================================
-- Run this query to verify:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.table_name = 'admin_activity_logs' 
--   AND tc.constraint_type = 'FOREIGN KEY'
--   AND kcu.column_name = 'admin_id';

