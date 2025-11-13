import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(_req, { params }) {
  try {
    const { id: tryoutId } = await params;
    if (!tryoutId) {
      return NextResponse.json({ error: "Tryout ID required" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    
    // Step 1: Get questions
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("id,nomor,text,explanation,created_at,correct_answer_option_id")
      .eq("tryout_id", tryoutId)
      .order("nomor", { ascending: true });

    if (questionsError) throw questionsError;

    if (!questionsData || questionsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Step 2: Get answer options separately
    const questionIds = questionsData.map((q) => q.id);
    const { data: answerOptionsData, error: answerOptionsError } = await supabase
      .from("answer_options")
      .select("id,question_id,text,order_index")
      .in("question_id", questionIds)
      .order("question_id")
      .order("order_index");

    if (answerOptionsError) throw answerOptionsError;

    // Step 3: Group answer options by question_id
    const answerOptionsMap = new Map();
    (answerOptionsData || []).forEach((opt) => {
      if (!answerOptionsMap.has(opt.question_id)) {
        answerOptionsMap.set(opt.question_id, []);
      }
      answerOptionsMap.get(opt.question_id).push(opt);
    });

    // Step 4: Map and combine data
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
        nomor: q.nomor,
        text: q.text,
        explanation: q.explanation,
        answerOptions,
        correctAnswerOptionId: q.correct_answer_option_id,
        createdAt: q.created_at,
      };
    });

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  try {
    const { id: tryoutId } = await params;
    if (!tryoutId) {
      return NextResponse.json({ error: "Tryout ID required" }, { status: 400 });
    }

    const body = await request.json();
    const supabase = getSupabaseServer();

    if (!body.nomor || !body.text || !body.answerOptions?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: question, error: qError } = await supabase
      .from("questions")
      .insert({
        tryout_id: tryoutId,
        nomor: Number(body.nomor),
        text: body.text.trim(),
        explanation: body.explanation?.trim() || null,
      })
      .select("id")
      .single();

    if (qError) throw qError;

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

    // Fetch question separately
    const { data: fullQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("id,nomor,text,explanation,created_at,correct_answer_option_id")
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
      nomor: fullQuestion.nomor,
      text: fullQuestion.text,
      explanation: fullQuestion.explanation,
      answerOptions: (fullAnswerOptions || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.id === fullQuestion.correct_answer_option_id,
        })),
      correctAnswerOptionId: fullQuestion.correct_answer_option_id,
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

