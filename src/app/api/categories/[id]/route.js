import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/categories/[id]
 * Get single category
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, created_at")
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
      createdAt: data.created_at,
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
 * PATCH /api/categories/[id]
 * Update category (requires admin auth)
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
      .from("categories")
      .select("name, description")
      .eq("id", id)
      .maybeSingle();

    const payload = {};
    if (body.name !== undefined) {
      payload.name = (body.name || "").trim();
    }
    if (body.description !== undefined) {
      payload.description = (body.description || "").trim() || null;
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
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("id, name, description, created_at")
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Category dengan nama tersebut sudah ada" },
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
      createdAt: data.created_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.CATEGORY,
      resourceId: resp.id,
      description: `Mengupdate category: ${resp.name}`,
      metadata: {
        old_values: oldData,
        new_values: {
          name: resp.name,
          description: resp.description,
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
 * DELETE /api/categories/[id]
 * Delete category (requires admin auth)
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

    // Get category info for logging
    const { data: categoryData } = await supabase
      .from("categories")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!categoryData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if category is used by any tryout
    const { data: tryoutsUsingCategory, error: checkError } = await supabase
      .from("tryouts")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (checkError) throw checkError;

    if (tryoutsUsingCategory && tryoutsUsingCategory.length > 0) {
      return NextResponse.json(
        {
          error:
            "Category tidak bisa dihapus karena masih digunakan oleh tryout",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.CATEGORY,
      resourceId: id,
      description: `Menghapus category: ${categoryData.name}`,
      metadata: {
        old_values: {
          name: categoryData.name,
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

