import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/packages
 * List semua packages (dengan filter is_active optional)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("is_active");

    const supabase = getSupabaseServer();
    let query = supabase
      .from("packages")
      .select("id, name, description, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    // Filter by is_active if provided
    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || "",
      isActive: pkg.is_active,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
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
 * POST /api/packages
 * Create package baru (requires admin auth)
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

    const payload = {
      name: (body.name || "").trim(),
      description: (body.description || "").trim() || null,
      is_active: body.isActive !== undefined ? !!body.isActive : true,
    };

    if (!payload.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("packages")
      .insert(payload)
      .select("id, name, description, is_active, created_at, updated_at")
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Package dengan nama tersebut sudah ada" },
          { status: 400 }
        );
      }
      throw error;
    }

    const resp = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.PACKAGE,
      resourceId: resp.id,
      description: `Membuat package: ${resp.name}`,
      metadata: {
        new_values: {
          name: resp.name,
          description: resp.description,
          isActive: resp.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

