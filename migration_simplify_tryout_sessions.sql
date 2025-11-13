-- Migration: Simplify tryout_sessions - remove session_type and related columns
-- Date: 2025-01-12
-- Keterangan: Struktur disederhanakan, hanya relasi tryout -> subscription_type
-- Tidak perlu session_type, is_completed, assigned_at

-- Step 1: Drop constraint CHECK untuk session_type
ALTER TABLE public.tryout_sessions 
  DROP CONSTRAINT IF EXISTS tryout_sessions_session_type_check;

-- Step 2: Drop kolom session_type
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS session_type;

-- Step 3: Drop kolom is_completed (tidak diperlukan)
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS is_completed;

-- Step 4: Drop kolom assigned_at (gunakan created_at saja)
ALTER TABLE public.tryout_sessions 
  DROP COLUMN IF EXISTS assigned_at;

-- Note: 
-- - Struktur sekarang: tryout_id -> subscription_type_id
-- - available_until tetap untuk batas waktu akses (opsional)
-- - is_active tetap untuk status aktif/nonaktif
-- - Tabel ini menghubungkan paket (tryout) dengan subscription type

