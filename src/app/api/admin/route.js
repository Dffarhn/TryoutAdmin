import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { createAdminApiSchema } from "@/lib/validations/adminSchema";
import { createAdmin } from "@/lib/adminAuth";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/admin
 * List semua admin
 */
export async function GET(request) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("is_active");
    const isSuperAdmin = searchParams.get("is_super_admin");

    let query = supabase
      .from("admins")
      .select("id, username, full_name, email, is_super_admin, is_active, last_login_at, created_at, updated_at")
      .order("created_at", { ascending: false });

    // Apply filters
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    if (isSuperAdmin !== null) {
      query = query.eq("is_super_admin", isSuperAdmin === "true");
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((admin) => ({
      id: admin.id,
      username: admin.username,
      fullName: admin.full_name,
      email: admin.email,
      isSuperAdmin: admin.is_super_admin,
      isActive: admin.is_active,
      lastLoginAt: admin.last_login_at,
      createdAt: admin.created_at,
      updatedAt: admin.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin
 * Create admin baru
 */
export async function POST(request) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Validate input
    const validated = createAdminApiSchema.parse(body);

    // Create admin
    // Convert empty strings to null
    const emailValue = validated.email?.trim();
    const fullNameValue = validated.fullName?.trim();
    const newAdmin = await createAdmin({
      username: validated.username,
      password: validated.password,
      fullName: fullNameValue && fullNameValue !== "" ? fullNameValue : null,
      email: emailValue && emailValue !== "" ? emailValue : null,
      isSuperAdmin: validated.isSuperAdmin,
    });

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.ADMIN,
      resourceId: newAdmin.id,
      description: `Membuat admin baru: ${newAdmin.username}`,
      metadata: {
        new_values: {
          username: newAdmin.username,
          isSuperAdmin: newAdmin.is_super_admin,
        },
      },
      ipAddress,
      userAgent,
    });

    const mapped = {
      id: newAdmin.id,
      username: newAdmin.username,
      fullName: newAdmin.full_name,
      email: newAdmin.email,
      isSuperAdmin: newAdmin.is_super_admin,
      isActive: newAdmin.is_active,
      createdAt: newAdmin.created_at,
    };

    return NextResponse.json({ data: mapped }, { status: 201 });
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

