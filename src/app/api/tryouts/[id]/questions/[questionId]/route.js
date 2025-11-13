import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function GET(_req, { params }) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    
    // Get question separately
    const { data, error } = await supabase
      .from("questions")
      .select("id,nomor,text,explanation,created_at,correct_answer_option_id")
      .eq("id", questionId)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get answer options separately
    const { data: answerOptionsData, error: answerOptionsError } = await supabase
      .from("answer_options")
      .select("id,text,order_index")
      .eq("question_id", questionId)
      .order("order_index");

    if (answerOptionsError) throw answerOptionsError;

    const mapped = {
      id: data.id,
      nomor: data.nomor,
      text: data.text,
      explanation: data.explanation,
      answerOptions: (answerOptionsData || [])
        .sort((a, b) => a.order_index - b.order_index)
        .map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.id === data.correct_answer_option_id,
        })),
      correctAnswerOptionId: data.correct_answer_option_id,
      createdAt: data.created_at,
    };

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const supabase = getSupabaseServer();

    if (body.nomor !== undefined || body.text !== undefined || body.explanation !== undefined) {
      const updateData = {};
      if (body.nomor !== undefined) updateData.nomor = Number(body.nomor);
      if (body.text !== undefined) updateData.text = body.text.trim();
      if (body.explanation !== undefined)
        updateData.explanation = body.explanation?.trim() || null;

      const { error: updateError } = await supabase
        .from("questions")
        .update(updateData)
        .eq("id", questionId);

      if (updateError) throw updateError;
    }

    if (body.answerOptions) {
      const { data: existingOptions, error: fetchError } = await supabase
        .from("answer_options")
        .select("id")
        .eq("question_id", questionId);

      if (fetchError) throw fetchError;

      const existingIds = existingOptions.map((opt) => opt.id);
      const newOptions = body.answerOptions.filter((opt) => !opt.id);
      const updatedOptions = body.answerOptions.filter((opt) => opt.id);

      for (const opt of updatedOptions) {
        const { error: updateOptError } = await supabase
          .from("answer_options")
          .update({
            text: opt.text.trim(),
            order_index: body.answerOptions.indexOf(opt),
          })
          .eq("id", opt.id);

        if (updateOptError) throw updateOptError;
      }

      if (newOptions.length > 0) {
        const newOptionRows = newOptions.map((opt, index) => ({
          question_id: questionId,
          text: opt.text.trim(),
          order_index: body.answerOptions.indexOf(opt),
        }));

        const { error: insertError } = await supabase
          .from("answer_options")
          .insert(newOptionRows);

        if (insertError) throw insertError;
      }

      const optionsToDelete = existingIds.filter(
        (id) => !body.answerOptions.some((opt) => opt.id === id)
      );

      if (optionsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("answer_options")
          .delete()
          .in("id", optionsToDelete);

        if (deleteError) throw deleteError;
      }

      const correctIndex = body.answerOptions.findIndex((opt) => opt.isCorrect);
      if (correctIndex >= 0) {
        const { data: allOptions, error: allOptsError } = await supabase
          .from("answer_options")
          .select("id")
          .eq("question_id", questionId)
          .order("order_index", { ascending: true });

        if (allOptsError) throw allOptsError;

        const correctAnswerOptionId = allOptions[correctIndex]?.id || null;

        const { error: updateCorrectError } = await supabase
          .from("questions")
          .update({ correct_answer_option_id: correctAnswerOptionId })
          .eq("id", questionId);

        if (updateCorrectError) throw updateCorrectError;
      }
    }

    // Fetch question separately
    const { data: fullQuestion, error: fetchError } = await supabase
      .from("questions")
      .select("id,nomor,text,explanation,created_at,correct_answer_option_id")
      .eq("id", questionId)
      .single();

    if (fetchError) throw fetchError;

    // Fetch answer options separately
    const { data: fullAnswerOptions, error: fetchAOsError } = await supabase
      .from("answer_options")
      .select("id,text,order_index")
      .eq("question_id", questionId)
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

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  try {
    const { questionId } = await params;
    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();

    const { error: deleteOptsError } = await supabase
      .from("answer_options")
      .delete()
      .eq("question_id", questionId);

    if (deleteOptsError) throw deleteOptsError;

    const { error: deleteQError } = await supabase
      .from("questions")
      .delete()
      .eq("id", questionId);

    if (deleteQError) throw deleteQError;

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

