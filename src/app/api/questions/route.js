import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";

/**
 * GET /api/questions
 * List semua questions (reusable pool) - untuk dipilih dan di-assign ke sub-chapters
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || null; // OPSIONAL: untuk filtering
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const supabase = getSupabaseServer();
    
    // Step 1: Get total count with same filters
    let countQuery = supabase
      .from("questions")
      .select("*", { count: "exact", head: true });

    if (search) {
      countQuery = countQuery.ilike("text", `%${search}%`);
    }

    if (categoryId) {
      countQuery = countQuery.eq("category_id", categoryId);
    }

    const { count, error: countError } = await countQuery;
    if (countError) throw countError;

    // Step 2: Get questions with category name
    let query = supabase
      .from("questions")
      .select("id,text,explanation,link,created_at,correct_answer_option_id,category_id,categories(name)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("text", `%${search}%`);
    }

    // Filter by category_id jika diberikan (OPSIONAL)
    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: questionsData, error: questionsError } = await query;

    if (questionsError) throw questionsError;

    if (!questionsData || questionsData.length === 0) {
      return NextResponse.json({ 
        data: [],
        total: count || 0,
        limit,
        offset,
      });
    }

    // Step 3: Get all question IDs
    const questionIds = questionsData.map((q) => q.id);

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
    const mapped = questionsData.map((q) => {
      const answerOptions = (answerOptionsMap.get(q.id) || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.id === q.correct_answer_option_id,
        }));

      return {
        id: q.id,
        text: q.text,
        explanation: q.explanation || "",
        link: q.link || null,
        answerOptions,
        correctAnswerOptionId: q.correct_answer_option_id,
        categoryId: q.category_id, // OPSIONAL: untuk filtering
        categoryName: q.categories?.name || null, // Nama kategori untuk display
        createdAt: q.created_at,
      };
    });

    return NextResponse.json({ 
      data: mapped,
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/questions
 * Create question baru (independen, tanpa tryout_id) - requires admin auth
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

    if (!body.text || !body.answerOptions?.length) {
      return NextResponse.json(
        { error: "Text dan answer options wajib diisi" },
        { status: 400 }
      );
    }

    // Create question tanpa tryout_id (independen)
    const { data: question, error: qError } = await supabase
      .from("questions")
      .insert({
        tryout_id: null, // Independen
        nomor: null, // Urutan via question_sub_chapters
        category_id: body.categoryId || null, // OPSIONAL: untuk filtering
        text: body.text.trim(),
        explanation: body.explanation?.trim() || null,
        link: body.link?.trim() || null,
      })
      .select("id")
      .single();

    if (qError) throw qError;

    // Create answer options
    const answerOptionRows = body.answerOptions.map((opt, index) => ({
      question_id: question.id,
      text: opt.text.trim(),
      order_index: index,
    }));

    const { data: answerOptions, error: aoError } = await supabase
      .from("answer_options")
      .insert(answerOptionRows)
      .select("id");

    if (aoError) throw aoError;

    // Set correct answer
    const correctIndex = body.answerOptions.findIndex((opt) => opt.isCorrect);
    const correctAnswerOptionId =
      correctIndex >= 0 ? answerOptions[correctIndex].id : null;

    if (correctAnswerOptionId) {
      const { error: updateError } = await supabase
        .from("questions")
        .update({ correct_answer_option_id: correctAnswerOptionId })
        .eq("id", question.id);

      if (updateError) throw updateError;
    }

    // Fetch full question with category name
    const { data: fullQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("id,text,explanation,link,created_at,correct_answer_option_id,category_id,categories(name)")
      .eq("id", question.id)
      .single();

    if (fetchError) throw fetchError;

    // Fetch answer options separately
    const { data: fullAnswerOptions, error: fetchAOsError } = await supabase
      .from("answer_options")
      .select("id,text,order_index")
      .eq("question_id", question.id)
      .order("order_index");

    if (fetchAOsError) throw fetchAOsError;

    const mapped = {
      id: fullQuestion.id,
      text: fullQuestion.text,
      explanation: fullQuestion.explanation || "",
      link: fullQuestion.link || null,
      answerOptions: (fullAnswerOptions || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.id === fullQuestion.correct_answer_option_id,
        })),
      correctAnswerOptionId: fullQuestion.correct_answer_option_id,
      categoryId: fullQuestion.category_id, // OPSIONAL: untuk filtering
      categoryName: fullQuestion.categories?.name || null, // Nama kategori untuk display
      createdAt: fullQuestion.created_at,
    };

    return NextResponse.json({ data: mapped }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}
