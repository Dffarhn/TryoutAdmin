import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/tryouts/[id]/sub-chapters/[subChapterId]/questions
 * List questions untuk sub-chapter tertentu (dengan order_index dari junction table)
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

    // Get questions via question_sub_chapters junction table
    // Step 1: Get junction table data
    const { data: junctionData, error: junctionError } = await supabase
      .from("question_sub_chapters")
      .select("id,order_index,question_id")
      .eq("sub_chapter_id", subChapterId)
      .order("order_index", { ascending: true });

    if (junctionError) throw junctionError;

    if (!junctionData || junctionData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 2: Get all question IDs
    const questionIds = junctionData.map((j) => j.question_id);

    // Step 3: Get questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id,text,explanation,link,created_at,correct_answer_option_id")
      .in("id", questionIds);

    if (questionsError) throw questionsError;

    // Step 4: Get answer options separately
    const { data: answerOptionsData, error: answerOptionsError } = await supabase
      .from("answer_options")
      .select("id,question_id,text,order_index")
      .in("question_id", questionIds)
      .order("question_id")
      .order("order_index");

    if (answerOptionsError) throw answerOptionsError;

    // Step 5: Group answer options by question_id
    const answerOptionsMap = new Map();
    (answerOptionsData || []).forEach((opt) => {
      if (!answerOptionsMap.has(opt.question_id)) {
        answerOptionsMap.set(opt.question_id, []);
      }
      answerOptionsMap.get(opt.question_id).push(opt);
    });

    // Step 6: Map and combine data
    const questionMap = new Map(
      (questionsData || []).map((q) => {
        const answerOptions = (answerOptionsMap.get(q.id) || [])
          .sort((a, b) => a.order_index - b.order_index)
          .map((opt) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.id === q.correct_answer_option_id,
          }));

        return [
          q.id,
          {
            id: q.id,
            text: q.text,
            explanation: q.explanation || "",
            link: q.link || null,
            answerOptions,
            correctAnswerOptionId: q.correct_answer_option_id,
            createdAt: q.created_at,
          },
        ];
      })
    );

    const mapped = junctionData
      .map((qsc) => {
        const question = questionMap.get(qsc.question_id);
        if (!question) return null;

        return {
          ...question,
          questionSubChapterId: qsc.id,
          orderIndex: qsc.order_index,
        };
      })
      .filter((q) => q !== null);

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tryouts/[id]/sub-chapters/[subChapterId]/questions
 * Assign question ke sub-chapter (requires admin auth)
 * Body: { questionId: string, orderIndex?: number }
 */
export async function POST(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: tryoutId, subChapterId } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    if (!body.questionId) {
      return NextResponse.json(
        { error: "questionId required" },
        { status: 400 }
      );
    }

    // Verify sub-chapter exists and belongs to tryout
    const { data: subChapter, error: scError } = await supabase
      .from("sub_chapters")
      .select("id, tryout_id, categories(name)")
      .eq("id", subChapterId)
      .eq("tryout_id", tryoutId)
      .maybeSingle();

    if (scError) throw scError;
    if (!subChapter) {
      return NextResponse.json(
        { error: "Sub-chapter not found" },
        { status: 404 }
      );
    }

    // Verify question exists
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("id, text")
      .eq("id", body.questionId)
      .maybeSingle();

    if (qError) throw qError;
    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from("question_sub_chapters")
      .select("id")
      .eq("question_id", body.questionId)
      .eq("sub_chapter_id", subChapterId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      return NextResponse.json(
        { error: "Question sudah ada di sub-chapter ini" },
        { status: 400 }
      );
    }

    // Get max order_index for this sub-chapter
    const { data: maxOrder, error: maxError } = await supabase
      .from("question_sub_chapters")
      .select("order_index")
      .eq("sub_chapter_id", subChapterId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (maxError) throw maxError;
    const orderIndex = body.orderIndex !== undefined
      ? Number(body.orderIndex)
      : (maxOrder?.order_index ?? -1) + 1;

    // Insert into junction table
    const { data, error } = await supabase
      .from("question_sub_chapters")
      .insert({
        question_id: body.questionId,
        sub_chapter_id: subChapterId,
        order_index: orderIndex,
      })
      .select("id,order_index,question_id")
      .single();

    if (error) throw error;

    // Get question separately
    const { data: fullQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("id,text,explanation,created_at,correct_answer_option_id")
      .eq("id", body.questionId)
      .single();

    if (fetchError) throw fetchError;

    // Get answer options separately
    const { data: answerOptionsData, error: fetchAOsError } = await supabase
      .from("answer_options")
      .select("id,text,order_index")
      .eq("question_id", body.questionId)
      .order("order_index");

    if (fetchAOsError) throw fetchAOsError;

    const resp = {
      id: fullQuestion.id,
      text: fullQuestion.text,
      explanation: fullQuestion.explanation || "",
      answerOptions: (answerOptionsData || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.id === fullQuestion.correct_answer_option_id,
        })),
      correctAnswerOptionId: fullQuestion.correct_answer_option_id,
      createdAt: fullQuestion.created_at,
      questionSubChapterId: data.id,
      orderIndex: data.order_index,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: tryoutId,
      description: `Menambahkan soal ke sub-chapter: ${subChapter.categories?.name || "Sub-Bab"}`,
      metadata: {
        new_values: {
          questionId: body.questionId,
          subChapterId: subChapterId,
          orderIndex: orderIndex,
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

