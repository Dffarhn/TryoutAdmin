import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/tryouts/[id]/sub-chapters
 * List sub-chapters untuk tryout tertentu
 */
export async function GET(_req, { params }) {
  try {
    const { id: tryoutId } = await params;
    if (!tryoutId) {
      return NextResponse.json(
        { error: "Tryout ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sub_chapters")
      .select("id, tryout_id, category_id, order_index, created_at, categories(name)")
      .eq("tryout_id", tryoutId)
      .order("order_index", { ascending: true });

    if (error) throw error;

    const mapped = (data || []).map((sc) => ({
      id: sc.id,
      tryoutId: sc.tryout_id,
      categoryId: sc.category_id,
      categoryName: sc.categories?.name || "",
      orderIndex: sc.order_index,
      createdAt: sc.created_at,
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
 * POST /api/tryouts/[id]/sub-chapters
 * Create sub-chapter baru (requires admin auth)
 */
export async function POST(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId } = await params;
    if (!tryoutId) {
      return NextResponse.json(
        { error: "Tryout ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Verify tryout exists
    const { data: tryout, error: tryoutError } = await supabase
      .from("tryouts")
      .select("id, title")
      .eq("id", tryoutId)
      .maybeSingle();

    if (tryoutError) throw tryoutError;
    if (!tryout) {
      return NextResponse.json(
        { error: "Tryout not found" },
        { status: 404 }
      );
    }

    if (!body.categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const payload = {
      tryout_id: tryoutId,
      category_id: body.categoryId, // WAJIB: setiap sub-chapter harus punya kategori
      order_index: body.orderIndex !== undefined ? Number(body.orderIndex) : 0,
    };

    const { data, error } = await supabase
      .from("sub_chapters")
      .insert(payload)
      .select("id, tryout_id, category_id, order_index, created_at, categories(name)")
      .single();

    if (error) throw error;

    const resp = {
      id: data.id,
      tryoutId: data.tryout_id,
      categoryId: data.category_id,
      categoryName: data.categories?.name || "",
      orderIndex: data.order_index,
      createdAt: data.created_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Membuat sub-chapter: ${resp.categoryName} untuk tryout ${tryout.title}`,
      metadata: {
        new_values: {
          categoryName: resp.categoryName,
          orderIndex: resp.orderIndex,
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

