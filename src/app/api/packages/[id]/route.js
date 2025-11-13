import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/packages/[id]
 * Get single package
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("packages")
      .select("id, name, description, is_active, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resp = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/packages/[id]
 * Update package (requires admin auth)
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

    // Get old values for logging
    const { data: oldData } = await supabase
      .from("packages")
      .select("name, description, is_active")
      .eq("id", id)
      .maybeSingle();

    const payload = {};
    if (body.name !== undefined) {
      payload.name = (body.name || "").trim();
    }
    if (body.description !== undefined) {
      payload.description = (body.description || "").trim() || null;
    }
    if (body.isActive !== undefined) {
      payload.is_active = !!body.isActive;
    }
    if (body.isActive !== undefined || body.name !== undefined || body.description !== undefined) {
      payload.updated_at = new Date().toISOString();
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    if (payload.name === "") {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("packages")
      .update(payload)
      .eq("id", id)
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

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.PACKAGE,
      resourceId: resp.id,
      description: `Mengupdate package: ${resp.name}`,
      metadata: {
        old_values: oldData,
        new_values: {
          name: resp.name,
          description: resp.description,
          isActive: resp.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/packages/[id]
 * Delete package (requires admin auth)
 */
export async function DELETE(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Get package info for logging
    const { data: packageData } = await supabase
      .from("packages")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!packageData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if package is used by any tryout
    const { data: tryoutsUsingPackage, error: checkError } = await supabase
      .from("tryouts")
      .select("id")
      .eq("package_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (tryoutsUsingPackage && tryoutsUsingPackage.length > 0) {
      return NextResponse.json(
        {
          error:
            "Package tidak bisa dihapus karena masih digunakan oleh tryout",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("packages").delete().eq("id", id);

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.PACKAGE,
      resourceId: id,
      description: `Menghapus package: ${packageData.name}`,
      metadata: {
        old_values: {
          name: packageData.name,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

