import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * PATCH /api/tryouts/[id]/sub-chapters/[subChapterId]/questions/[questionSubChapterId]
 * Update order_index question di sub-chapter (requires admin auth)
 */
export async function PATCH(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId, subChapterId, questionSubChapterId } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    if (body.orderIndex === undefined) {
      return NextResponse.json(
        { error: "orderIndex required" },
        { status: 400 }
      );
    }

    // Verify sub-chapter belongs to tryout
    const { data: subChapter } = await supabase
      .from("sub_chapters")
      .select("id, categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    if (!subChapter) {
      return NextResponse.json(
        { error: "Sub-chapter not found" },
        { status: 404 }
      );
    }

    // Update order_index
    const { data, error } = await supabase
      .from("question_sub_chapters")
      .update({ order_index: Number(body.orderIndex) })
      .eq("id", questionSubChapterId)
      .eq("sub_chapter_id", subChapterId)
      .select("id,order_index")
      .single();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Mengupdate urutan soal di sub-chapter: ${subChapter.categories?.name || "Sub-Bab"}`,
      metadata: {
        new_values: {
          orderIndex: body.orderIndex,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tryouts/[id]/sub-chapters/[subChapterId]/questions/[questionSubChapterId]
 * Remove question dari sub-chapter (requires admin auth)
 */
export async function DELETE(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId, subChapterId, questionSubChapterId } = await params;
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Verify sub-chapter belongs to tryout
    const { data: subChapter } = await supabase
      .from("sub_chapters")
      .select("id, categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    if (!subChapter) {
      return NextResponse.json(
        { error: "Sub-chapter not found" },
        { status: 404 }
      );
    }

    // Get question info for logging
    const { data: qscData } = await supabase
      .from("question_sub_chapters")
      .select("question_id,questions(text)")
      .eq("id", questionSubChapterId)
      .maybeSingle();

    // Delete from junction table (question tidak dihapus, hanya relasinya)
    const { error } = await supabase
      .from("question_sub_chapters")
      .delete()
      .eq("id", questionSubChapterId)
      .eq("sub_chapter_id", subChapterId);

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Menghapus soal dari sub-chapter: ${subChapter.categories?.name || "Sub-Bab"}`,
      metadata: {
        old_values: {
          questionId: qscData?.question_id,
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

