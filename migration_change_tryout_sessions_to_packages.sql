-- Migration: Change tryout_sessions to link packages instead of tryouts
-- Date: 2025-01-12
-- Keterangan: Relasi seharusnya antara package_id dengan subscription_type_id, bukan tryout_id

-- Step 1: Drop foreign key constraint untuk tryout_id
ALTER TABLE public.tryout_sessions 
  DROP CONSTRAINT IF EXISTS tryout_sessions_tryout_id_fkey;

-- Step 2: Rename kolom tryout_id menjadi package_id
ALTER TABLE public.tryout_sessions 
  RENAME COLUMN tryout_id TO package_id;

-- Step 3: Add foreign key constraint untuk package_id
ALTER TABLE public.tryout_sessions 
  ADD CONSTRAINT tryout_sessions_package_id_fkey 
  FOREIGN KEY (package_id) REFERENCES public.packages(id);

-- Note: 
-- - Struktur sekarang: package_id -> subscription_type_id
-- - Tabel ini menghubungkan paket dengan subscription type
-- - available_until untuk batas waktu akses (opsional)
-- - is_active untuk status aktif/nonaktif

