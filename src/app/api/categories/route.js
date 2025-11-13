import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/categories
 * List semua categories
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description || "",
      createdAt: cat.created_at,
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
 * POST /api/categories
 * Create category baru (requires admin auth)
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
    };

    if (!payload.name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
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

    const resp = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      createdAt: data.created_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.CATEGORY,
      resourceId: resp.id,
      description: `Membuat category: ${resp.name}`,
      metadata: {
        new_values: {
          name: resp.name,
          description: resp.description,
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

