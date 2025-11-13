-- ============================================
-- ADMIN TABLE (Simple - Username/Password)
-- ============================================
-- Tabel admin dengan username dan password biasa
-- Tidak menggunakan auth.users

-- ============================================
-- 1. ADMIN TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL, -- Password yang sudah di-hash
  full_name text,
  email text,
  is_super_admin boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index
DROP INDEX IF EXISTS idx_admins_username;
DROP INDEX IF EXISTS idx_admins_is_active;
CREATE INDEX idx_admins_username ON public.admins(username);
CREATE INDEX idx_admins_is_active ON public.admins(is_active);

-- ============================================
-- 2. ADMIN ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES public.admins(id) ON DELETE SET NULL,
  action_type text NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', dll
  resource_type text NOT NULL, -- 'TRYOUT', 'QUESTION', 'ANSWER_OPTION', 'USER', 'PACKAGE', 'CATEGORY', dll
  resource_id uuid, -- ID dari resource yang diubah
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

CREATE INDEX idx_admin_activity_logs_admin_id ON public.admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_action_type ON public.admin_activity_logs(action_type);
CREATE INDEX idx_admin_activity_logs_resource_type ON public.admin_activity_logs(resource_type);
CREATE INDEX idx_admin_activity_logs_resource_id ON public.admin_activity_logs(resource_id);
CREATE INDEX idx_admin_activity_logs_created_at ON public.admin_activity_logs(created_at DESC);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS untuk admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Super admin can manage admins" ON public.admins;

-- Admin bisa melihat semua admins (untuk dashboard)
-- Note: Authentication akan dihandle di application layer
CREATE POLICY "Admins can view all admins"
  ON public.admins
  FOR SELECT
  TO authenticated
  USING (true);

-- Super admin bisa manage admins
CREATE POLICY "Super admin can manage admins"
  ON public.admins
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.id = (SELECT current_setting('app.current_admin_id', true)::uuid)
      AND a.is_super_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admins a
      WHERE a.id = (SELECT current_setting('app.current_admin_id', true)::uuid)
      AND a.is_super_admin = true
    )
  );

-- Enable RLS untuk admin_activity_logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_logs;
DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_logs;

-- Admin bisa melihat semua activity logs
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- System bisa insert activity logs
CREATE POLICY "System can insert activity logs"
  ON public.admin_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger untuk update updated_at pada admins
CREATE OR REPLACE FUNCTION update_admins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION update_admins_updated_at();

-- ============================================
-- 5. HELPER FUNCTIONS
-- ============================================

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
-- 6. VIEWS
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

