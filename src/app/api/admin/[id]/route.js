import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { updateAdminSchema } from "@/lib/validations/adminSchema";
import { updateAdmin } from "@/lib/adminAuth";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/admin/[id]
 * Get single admin by ID
 */
export async function GET(_req, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();

    const { data, error } = await supabase
      .from("admins")
      .select("id, username, full_name, email, is_super_admin, is_active, last_login_at, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
      }
      throw error;
    }

    const mapped = {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      email: data.email,
      isSuperAdmin: data.is_super_admin,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/[id]
 * Update admin
 */
export async function PATCH(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Prevent admin from deleting themselves
    if (id === adminUser.userId && body.isActive === false) {
      return NextResponse.json(
        { error: "Tidak dapat menonaktifkan akun sendiri" },
        { status: 400 }
      );
    }

    // Get old data for logging
    const { data: oldData } = await supabase
      .from("admins")
      .select("username, full_name, email, is_super_admin, is_active")
      .eq("id", id)
      .single();

    if (!oldData) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Validate input
    const validated = updateAdminSchema.parse(body);

    // Update admin
    const updatedAdmin = await updateAdmin(id, {
      username: validated.username,
      password: validated.password,
      fullName: validated.fullName,
      email: validated.email,
      isSuperAdmin: validated.isSuperAdmin,
      isActive: validated.isActive,
    });

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.ADMIN,
      resourceId: id,
      description: `Mengupdate admin: ${updatedAdmin.username}`,
      metadata: {
        old_values: {
          username: oldData.username,
          isSuperAdmin: oldData.is_super_admin,
          isActive: oldData.is_active,
        },
        new_values: {
          username: updatedAdmin.username,
          isSuperAdmin: updatedAdmin.is_super_admin,
          isActive: updatedAdmin.is_active,
        },
      },
      ipAddress,
      userAgent,
    });

    const mapped = {
      id: updatedAdmin.id,
      username: updatedAdmin.username,
      fullName: updatedAdmin.full_name,
      email: updatedAdmin.email,
      isSuperAdmin: updatedAdmin.is_super_admin,
      isActive: updatedAdmin.is_active,
      lastLoginAt: updatedAdmin.last_login_at,
      createdAt: updatedAdmin.created_at,
      updatedAt: updatedAdmin.updated_at,
    };

    return NextResponse.json({ data: mapped });
  } catch (e) {
    if (e.errors) {
      // Zod validation error
      return NextResponse.json(
        { error: "Validation error", details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/[id]
 * Soft delete admin (set is_active = false)
 */
export async function DELETE(_req, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Prevent admin from deleting themselves
    if (id === adminUser.userId) {
      return NextResponse.json(
        { error: "Tidak dapat menghapus akun sendiri" },
        { status: 400 }
      );
    }

    // Get admin data for logging
    const { data: adminData } = await supabase
      .from("admins")
      .select("username, is_active")
      .eq("id", id)
      .single();

    if (!adminData) {
      return NextResponse.json({ error: "Admin tidak ditemukan" }, { status: 404 });
    }

    // Soft delete: set is_active = false
    const { data, error } = await supabase
      .from("admins")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, username")
      .single();

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.ADMIN,
      resourceId: id,
      description: `Menghapus admin: ${data.username}`,
      metadata: {
        old_values: {
          username: adminData.username,
          isActive: adminData.is_active,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Admin berhasil dihapus" });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

