/**
 * Admin Authentication
 * Menggunakan tabel admins dengan username/password biasa
 */

import { getSupabaseServer } from "./supabaseServer";
import { verifyPassword, hashPassword } from "./hashPassword";

/**
 * Login admin dengan username dan password
 * @param {string} username - Username admin
 * @param {string} password - Plain password
 * @returns {Promise<Object>} Admin data jika berhasil
 */
export async function loginAdmin(username, password) {
  const supabase = getSupabaseServer();

  // Get admin by username
  const { data: admin, error } = await supabase
    .from("admins")
    .select("id, username, password_hash, full_name, email, is_super_admin, is_active")
    .eq("username", username.trim())
    .eq("is_active", true)
    .single();

  if (error || !admin) {
    throw new Error("Username atau password salah");
  }

  // Verify password
  const isValid = await verifyPassword(password, admin.password_hash);
  if (!isValid) {
    throw new Error("Username atau password salah");
  }

  // Update last_login_at
  await supabase
    .from("admins")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  // Return admin data (without password_hash)
  const { password_hash, ...adminData } = admin;
  return adminData;
}

/**
 * Get admin by ID
 * @param {string} adminId - Admin ID
 * @returns {Promise<Object|null>} Admin data
 */
export async function getAdminById(adminId) {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from("admins")
    .select("id, username, full_name, email, is_super_admin, is_active")
    .eq("id", adminId)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Check if username is already taken
 * @param {string} username - Username to check
 * @param {string} excludeId - Admin ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if username exists
 */
export async function isUsernameTaken(username, excludeId = null) {
  const supabase = getSupabaseServer();

  let query = supabase
    .from("admins")
    .select("id")
    .eq("username", username.trim())
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Error checking username");
  }

  return (data?.length || 0) > 0;
}

/**
 * Create admin
 * @param {Object} adminData - Admin data
 * @returns {Promise<Object>} Created admin data
 */
export async function createAdmin(adminData) {
  const supabase = getSupabaseServer();

  // Check username uniqueness
  const usernameTaken = await isUsernameTaken(adminData.username);
  if (usernameTaken) {
    throw new Error("Username sudah digunakan");
  }

  // Hash password
  const passwordHash = await hashPassword(adminData.password);

  // Insert admin
  const { data, error } = await supabase
    .from("admins")
    .insert({
      username: adminData.username.trim(),
      password_hash: passwordHash,
      full_name: adminData.fullName || null,
      email: adminData.email || null,
      is_super_admin: adminData.isSuperAdmin || false,
      is_active: true,
    })
    .select("id, username, full_name, email, is_super_admin, is_active, created_at")
    .single();

  if (error) {
    throw new Error(error.message || "Gagal membuat admin");
  }

  return data;
}

/**
 * Update admin
 * @param {string} adminId - Admin ID
 * @param {Object} adminData - Admin data to update
 * @returns {Promise<Object>} Updated admin data
 */
export async function updateAdmin(adminId, adminData) {
  const supabase = getSupabaseServer();

  // Check username uniqueness if username is being updated
  if (adminData.username) {
    const usernameTaken = await isUsernameTaken(adminData.username, adminId);
    if (usernameTaken) {
      throw new Error("Username sudah digunakan");
    }
  }

  const updateData = {
    updated_at: new Date().toISOString(),
  };

  if (adminData.username) {
    updateData.username = adminData.username.trim();
  }

  if (adminData.fullName !== undefined) {
    updateData.full_name = adminData.fullName || null;
  }

  if (adminData.email !== undefined) {
    updateData.email = adminData.email || null;
  }

  if (adminData.isSuperAdmin !== undefined) {
    updateData.is_super_admin = adminData.isSuperAdmin;
  }

  if (adminData.isActive !== undefined) {
    updateData.is_active = adminData.isActive;
  }

  // Hash password if provided
  if (adminData.password && adminData.password.trim() !== "") {
    updateData.password_hash = await hashPassword(adminData.password);
  }

  const { data, error } = await supabase
    .from("admins")
    .update(updateData)
    .eq("id", adminId)
    .select("id, username, full_name, email, is_super_admin, is_active, last_login_at, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(error.message || "Gagal mengupdate admin");
  }

  return data;
}
