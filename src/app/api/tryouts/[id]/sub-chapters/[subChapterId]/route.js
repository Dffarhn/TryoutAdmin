import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/tryouts/[id]/sub-chapters/[subChapterId]
 * Get single sub-chapter
 */
export async function GET(_req, { params }) {
  try {
    const { id: tryoutId, subChapterId } = await params;

    if (!tryoutId || !subChapterId) {
      return NextResponse.json(
        { error: "Tryout ID and Sub-Chapter ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("sub_chapters")
      .select("id, tryout_id, category_id, order_index, created_at, categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resp = {
      id: data.id,
      tryoutId: data.tryout_id,
      categoryId: data.category_id,
      categoryName: data.categories?.name || "",
      orderIndex: data.order_index,
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
 * PATCH /api/tryouts/[id]/sub-chapters/[subChapterId]
 * Update sub-chapter (requires admin auth)
 */
export async function PATCH(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId, subChapterId } = await params;

    if (!tryoutId || !subChapterId) {
      return NextResponse.json(
        { error: "Tryout ID and Sub-Chapter ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Get old values and tryout info for logging
    const { data: oldData } = await supabase
      .from("sub_chapters")
      .select("order_index, category_id, categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    const { data: tryout } = await supabase
      .from("tryouts")
      .select("title")
      .eq("id", tryoutId)
      .maybeSingle();

    const payload = {};
    if (body.categoryId !== undefined) {
      payload.category_id = body.categoryId; // Support update category
    }
    if (body.orderIndex !== undefined) {
      payload.order_index = Number(body.orderIndex);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("sub_chapters")
      .update(payload)
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .select("id, tryout_id, category_id, order_index, created_at, categories(name)")
      .single();

    if (error) throw error;

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Mengupdate sub-chapter: ${resp.categoryName} untuk tryout ${tryout?.title || tryoutId}`,
      metadata: {
        old_values: {
          categoryId: oldData?.category_id,
          orderIndex: oldData?.order_index,
        },
        new_values: {
          categoryName: resp.categoryName,
          orderIndex: resp.orderIndex,
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
 * DELETE /api/tryouts/[id]/sub-chapters/[subChapterId]
 * Delete sub-chapter (requires admin auth, dengan cascade check)
 */
export async function DELETE(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId, subChapterId } = await params;

    if (!tryoutId || !subChapterId) {
      return NextResponse.json(
        { error: "Tryout ID and Sub-Chapter ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Get sub-chapter info for logging
    const { data: subChapterData } = await supabase
      .from("sub_chapters")
      .select("categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    const { data: tryout } = await supabase
      .from("tryouts")
      .select("title")
      .eq("id", tryoutId)
      .maybeSingle();

    if (!subChapterData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if sub-chapter is used by any question (via question_sub_chapters)
    const { data: questionsUsingSubChapter, error: checkError } = await supabase
      .from("question_sub_chapters")
      .select("id")
      .eq("sub_chapter_id", subChapterId)
      .limit(1);

    if (checkError) throw checkError;

    if (questionsUsingSubChapter && questionsUsingSubChapter.length > 0) {
      return NextResponse.json(
        {
          error:
            "Sub-chapter tidak bisa dihapus karena masih digunakan oleh soal",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("sub_chapters")
      .delete()
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId);

    if (error) throw error;

    const categoryName = subChapterData.categories?.name || "Unknown";

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Menghapus sub-chapter: ${categoryName} dari tryout ${tryout?.title || tryoutId}`,
      metadata: {
        old_values: {
          categoryName: categoryName,
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

