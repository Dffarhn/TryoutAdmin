-- Migration: Remove session_type from tryout_sessions
-- Date: 2025-01-12
-- Keterangan: Session type tidak diperlukan, relasi langsung antara tryout dan subscription_type

-- Step 1: Drop constraint CHECK untuk session_type
ALTER TABLE public.tryout_sessions 
  DROP CONSTRAINT IF EXISTS tryout_sessions_session_type_check;

-- Step 2: Drop kolom session_type
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS session_type;

-- Step 3: Drop kolom is_completed (tidak diperlukan tanpa session_type progressive)
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS is_completed;

-- Step 4: Drop kolom assigned_at (bisa diganti dengan created_at)
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS assigned_at;

-- Note: 
-- - available_until tetap dipertahankan untuk batas waktu akses
-- - is_active tetap dipertahankan untuk status aktif/nonaktif
-- - Struktur sekarang lebih sederhana: tryout_id -> subscription_type_id dengan available_until

