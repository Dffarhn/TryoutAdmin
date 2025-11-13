/**
 * Get Admin User from Request
 * Helper untuk mendapatkan admin ID dari cookie di API routes
 */

import { cookies } from "next/headers";
import { getSupabaseServer } from "./supabaseServer";

export async function getAdminUserFromRequest() {
  try {
    const cookieStore = await cookies();
    const adminId = cookieStore.get("admin_id")?.value;

    if (!adminId) {
      return null;
    }

    const supabase = getSupabaseServer();

    // Get admin from admins table
    const { data: admin, error } = await supabase
      .from("admins")
      .select("id, username, full_name, email, is_super_admin, is_active")
      .eq("id", adminId)
      .eq("is_active", true)
      .single();

    if (error || !admin) {
      return null;
    }

    return {
      userId: admin.id, // Keep userId for compatibility
      adminId: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      email: admin.email,
      isAdmin: true,
      isSuperAdmin: admin.is_super_admin,
    };
  } catch (error) {
    console.error("Error getting admin user:", error);
    return null;
  }
}

