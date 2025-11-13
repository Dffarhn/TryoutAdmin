import { createClient } from "@supabase/supabase-js";

// Credentials dari action-plan.md
const DEFAULT_SUPABASE_URL = "https://ymsyfsdeuvamwgmggzhs.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3lmc2RldXZhbXdnbWdnemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzMTcxMTIsImV4cCI6MjA3Nzg5MzExMn0.9rJe2Fju22Vh0Yqzx1_dmq9eiH9fNMTlq-rpnfBp6bo";

export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
  
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}


