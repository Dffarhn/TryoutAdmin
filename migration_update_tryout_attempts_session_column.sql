-- Migration: Update tryout_attempts to use tryout_session_id instead of user_tryout_session_id
-- Date: 2025-01-12

-- Step 1: Drop the old column if it exists (if migration needs to be idempotent)
-- ALTER TABLE public.tryout_attempts DROP COLUMN IF EXISTS user_tryout_session_id;

-- Step 2: Add new column tryout_session_id with FK constraint
ALTER TABLE public.tryout_attempts 
  ADD COLUMN IF NOT EXISTS tryout_session_id uuid;

-- Step 3: Add foreign key constraint
ALTER TABLE public.tryout_attempts
  ADD CONSTRAINT tryout_attempts_tryout_session_id_fkey 
  FOREIGN KEY (tryout_session_id) 
  REFERENCES public.tryout_sessions(id)
  ON DELETE SET NULL;

-- Step 4: If there's existing data in user_tryout_session_id, migrate it
-- (Assuming user_tryout_session_id might have been used differently, 
--  we'll leave migration of existing data as manual if needed)
-- UPDATE public.tryout_attempts 
-- SET tryout_session_id = user_tryout_session_id 
-- WHERE user_tryout_session_id IS NOT NULL;

-- Step 5: Drop old column after migration (uncomment when ready)
-- ALTER TABLE public.tryout_attempts DROP COLUMN IF EXISTS user_tryout_session_id;

-- Note: The old column user_tryout_session_id will be kept for now to avoid data loss
-- Remove it manually after verifying the new column works correctly

