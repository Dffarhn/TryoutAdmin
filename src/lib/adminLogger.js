/**
 * Admin Activity Logger
 * Utility untuk logging aktivitas admin ke database
 */

import { getSupabaseServer } from "./supabaseServer";

/**
 * Log aktivitas admin
 * @param {Object} params
 * @param {string} params.userId - User ID dari auth.users
 * @param {string} params.actionType - 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', dll
 * @param {string} params.resourceType - 'TRYOUT', 'QUESTION', 'ANSWER_OPTION', 'USER', dll
 * @param {string} [params.resourceId] - ID resource yang diubah
 * @param {string} [params.description] - Deskripsi detail aktivitas
 * @param {Object} [params.metadata] - Data tambahan (old_values, new_values, dll)
 * @param {string} [params.ipAddress] - IP address admin
 * @param {string} [params.userAgent] - User agent browser
 */
export async function logAdminActivity({
  userId, // Now this is admin_id directly
  actionType,
  resourceType,
  resourceId = null,
  description = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const supabase = getSupabaseServer();

    // userId is now admin_id directly (from admins table)
    // Just verify it exists
    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("id")
      .eq("id", userId)
      .single();

    if (adminError || !admin) {
      console.error("Admin not found:", adminError);
      return null;
    }

    // Update last_login_at jika action adalah LOGIN
    if (actionType === "LOGIN") {
      await supabase
        .from("admins")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", userId);
    }

    // Log activity menggunakan RPC function
    const { data, error } = await supabase.rpc("log_admin_activity", {
      p_admin_id: userId,
      p_action_type: actionType,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_description: description,
      p_metadata: metadata,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Error logging admin activity:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in logAdminActivity:", error);
    return null;
  }
}

/**
 * Get request info untuk logging (IP address & user agent)
 * @param {Request} request - Next.js request object
 * @returns {Object} { ipAddress, userAgent }
 */
export function getRequestInfo(request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    null;

  const userAgent = request.headers.get("user-agent") || null;

  return { ipAddress, userAgent };
}

/**
 * Action Types constants
 */
export const ActionTypes = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  VIEW: "VIEW",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  PASSWORD_CHANGE: "PASSWORD_CHANGE",
  EXPORT: "EXPORT",
  IMPORT: "IMPORT",
  BULK_UPDATE: "BULK_UPDATE",
};

/**
 * Resource Types constants
 */
export const ResourceTypes = {
  TRYOUT: "TRYOUT",
  QUESTION: "QUESTION",
  ANSWER_OPTION: "ANSWER_OPTION",
  USER: "USER",
  PACKAGE: "PACKAGE",
  CATEGORY: "CATEGORY",
  ADMIN_PROFILE: "ADMIN_PROFILE",
  ADMIN: "ADMIN",
  SETTINGS: "SETTINGS",
  SUBSCRIPTION_TYPE: "SUBSCRIPTION_TYPE",
  TRANSACTION: "TRANSACTION",
  USER_SUBSCRIPTION: "USER_SUBSCRIPTION",
  TRYOUT_SESSION: "TRYOUT_SESSION",
};

