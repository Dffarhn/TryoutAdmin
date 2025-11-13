-- ============================================
-- ADMIN & AUDIT LOG SCHEMA
-- ============================================
-- Schema untuk akun admin dan logging aktivitas admin
-- Script ini bisa dijalankan berulang tanpa error (idempotent)

-- ============================================
-- 1. ADMIN PROFILES TABLE
-- ============================================
-- Menyimpan informasi admin (extend dari auth.users)

-- Drop existing constraints jika ada
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_profiles_user_id_fkey' 
    AND table_name = 'admin_profiles'
  ) THEN
    ALTER TABLE public.admin_profiles DROP CONSTRAINT IF EXISTS admin_profiles_user_id_fkey;
  END IF;
END $$;

-- Create table
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  is_admin boolean NOT NULL DEFAULT false,
  is_super_admin boolean NOT NULL DEFAULT false,
  full_name text,
  phone text,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'admin_profiles_user_id_fkey' 
    AND table_name = 'admin_profiles'
  ) THEN
    ALTER TABLE public.admin_profiles 
    ADD CONSTRAINT admin_profiles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index untuk performa
DROP INDEX IF EXISTS idx_admin_profiles_user_id;
DROP INDEX IF EXISTS idx_admin_profiles_is_admin;
CREATE INDEX idx_admin_profiles_user_id ON public.admin_profiles(user_id);
CREATE INDEX idx_admin_profiles_is_admin ON public.admin_profiles(is_admin);

-- ============================================
-- 2. ADMIN ACTIVITY LOGS TABLE
-- ============================================
-- Mencatat semua aktivitas yang dilakukan admin
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', dll
  resource_type text NOT NULL, -- 'TRYOUT', 'QUESTION', 'ANSWER_OPTION', 'USER', 'PACKAGE', 'CATEGORY', dll
  resource_id uuid, -- ID dari resource yang diubah (tryout_id, question_id, dll)
  description text, -- Deskripsi detail aktivitas
  metadata jsonb, -- Data tambahan dalam format JSON (old_values, new_values, dll)
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index untuk performa query
DROP INDEX IF EXISTS idx_admin_activity_logs_admin_id;
DROP INDEX IF EXISTS idx_admin_activity_logs_action_type;
DROP INDEX IF EXISTS idx_admin_activity_logs_resource_type;
DROP INDEX IF EXISTS idx_admin_activity_logs_resource_id;
DROP INDEX IF EXISTS idx_admin_activity_logs_created_at;
DROP INDEX IF EXISTS idx_admin_activity_logs_user_id;

CREATE INDEX idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX idx_admin_activity_logs_resource_type ON public.admin_activity_logs(resource_type);
CREATE INDEX idx_admin_activity_logs_resource_id ON public.admin_activity_logs(resource_id);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);
CREATE INDEX idx_admin_activity_logs_user_id ON public.admin_activity_logs(user_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS untuk admin_profiles
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Admin can view admin profiles" ON public.admin_profiles;
DROP POLICY IF EXISTS "Super admin can manage admin profiles" ON public.admin_profiles;

-- Admin bisa melihat semua admin profiles
CREATE POLICY "Admin can view admin profiles"
  ON public.admin_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid() AND ap.is_admin = true
    )
  );

-- Super admin bisa insert/update/delete admin profiles
CREATE POLICY "Super admin can manage admin profiles"
  ON public.admin_profiles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid() AND ap.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_profiles ap
      WHERE ap.user_id = auth.uid() AND ap.is_super_admin = true
    )
  );

-- Enable RLS untuk admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Admin can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_logs;

-- Admin bisa melihat semua activity logs
-- Note: RLS policy ini mungkin perlu disesuaikan dengan sistem auth yang digunakan
-- Jika menggunakan admins table dengan cookie-based auth, mungkin perlu disable RLS atau adjust policy
CREATE POLICY "Admin can view activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (true); -- Simplified: allow all authenticated users (adjust based on your auth system)

-- System bisa insert activity logs (via service role)
CREATE POLICY "System can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger untuk update updated_at pada admin_profiles
CREATE OR REPLACE FUNCTION update_admin_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_profiles_updated_at();

-- Trigger untuk auto-create admin_profiles saat user dibuat
CREATE OR REPLACE FUNCTION create_admin_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_profiles (user_id, is_admin, is_super_admin)
  VALUES (NEW.id, false, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_admin_profile_on_user_creation ON auth.users;
CREATE TRIGGER create_admin_profile_on_user_creation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_admin_profile_for_user();

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

-- Function untuk check apakah user adalah admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk check apakah user adalah super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE user_id = user_uuid AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk log aktivitas admin
CREATE OR REPLACE FUNCTION log_admin_activity(
  p_admin_id uuid,
  p_action_type text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO public.admin_activity_logs (
    admin_id,
    action_type,
    resource_type,
    resource_id,
    description,
    metadata,
    ip_address,
    user_agent
  )
  VALUES (
    p_admin_id,
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_description,
    p_metadata,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. SAMPLE DATA (Optional - untuk testing)
-- ============================================
-- Uncomment jika ingin membuat admin pertama
/*
-- Set admin pertama (ganti dengan user_id dari auth.users)
-- UPDATE public.admin_profiles
-- SET is_admin = true, is_super_admin = true
-- WHERE user_id = 'USER_ID_DARI_AUTH_USERS';
*/

-- ============================================
-- 7. VIEWS (Optional - untuk kemudahan query)
-- ============================================

-- View untuk melihat aktivitas admin dengan detail
DROP VIEW IF EXISTS admin_activity_logs_view;
CREATE VIEW admin_activity_logs_view AS
SELECT 
  al.id,
  al.created_at,
  al.action_type,
  al.resource_type,
  al.resource_id,
  al.description,
  al.metadata,
  al.ip_address,
  al.user_agent,
  a.id as admin_id,
  a.username as admin_username,
  a.full_name as admin_name,
  a.is_super_admin
FROM public.admin_activity_logs al
LEFT JOIN public.admins a ON al.admin_id = a.id
ORDER BY al.created_at DESC;

-- ============================================
-- CATATAN PENTING:
-- ============================================
-- 1. Setelah membuat schema, pastikan untuk:
--    - Set admin pertama melalui UPDATE query atau UI
--    - Update RLS policies sesuai kebutuhan
--
-- 2. Action Types yang disarankan:
--    - 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
--    - 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE'
--    - 'EXPORT', 'IMPORT', 'BULK_UPDATE'
--
-- 3. Resource Types yang disarankan:
--    - 'TRYOUT', 'QUESTION', 'ANSWER_OPTION'
--    - 'USER', 'PACKAGE', 'CATEGORY'
--    - 'ADMIN_PROFILE', 'SETTINGS'
--
-- 4. Metadata field bisa berisi:
--    {
--      "old_values": {...},
--      "new_values": {...},
--      "additional_info": "..."
--    }
--
-- 5. Untuk production, pertimbangkan:
--    - Archive old logs (retention policy)
--    - Add indexes untuk query yang sering
--    - Monitor log size dan cleanup rutin

