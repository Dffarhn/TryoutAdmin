import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/tryout-attempts/[id]
 * Get single attempt
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("tryout_attempts")
      .select(`
        id,
        user_id,
        tryout_id,
        started_at,
        completed_at,
        duration_minutes,
        total_questions,
        correct_count,
        wrong_count,
        unanswered_count,
        score,
        xp_earned,
        created_at,
        tryouts(id, title),
        user_profiles(id, name, email)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resp = {
      id: data.id,
      userId: data.user_id,
      userName: data.user_profiles?.name || data.user_profiles?.email || "Unknown",
      tryoutId: data.tryout_id,
      tryoutTitle: data.tryouts?.title || "Unknown",
      startedAt: data.started_at,
      completedAt: data.completed_at,
      durationMinutes: data.duration_minutes || 0,
      totalQuestions: data.total_questions || 0,
      correctCount: data.correct_count || 0,
      wrongCount: data.wrong_count || 0,
      unansweredCount: data.unanswered_count || 0,
      score: data.score || 0,
      xpEarned: data.xp_earned || 0,
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
 * PATCH /api/tryout-attempts/[id]
 * Update attempt (completion, score, dll)
 */
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();

    const payload = {};

    if (body.completedAt !== undefined) {
      payload.completed_at = body.completedAt || new Date().toISOString();
    }
    if (body.score !== undefined) {
      payload.score = body.score;
    }
    if (body.xpEarned !== undefined) {
      payload.xp_earned = body.xpEarned;
    }
    if (body.correctCount !== undefined) {
      payload.correct_count = body.correctCount;
    }
    if (body.wrongCount !== undefined) {
      payload.wrong_count = body.wrongCount;
    }
    if (body.unansweredCount !== undefined) {
      payload.unanswered_count = body.unansweredCount;
    }
    if (body.totalQuestions !== undefined) {
      payload.total_questions = body.totalQuestions;
    }
    if (body.durationMinutes !== undefined) {
      payload.duration_minutes = body.durationMinutes;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("tryout_attempts")
      .update(payload)
      .eq("id", id)
      .select(`
        id,
        user_id,
        tryout_id,
        started_at,
        completed_at,
        duration_minutes,
        total_questions,
        correct_count,
        wrong_count,
        unanswered_count,
        score,
        xp_earned,
        created_at,
        tryouts(id, title)
      `)
      .single();

    if (error) throw error;

    const resp = {
      id: data.id,
      userId: data.user_id,
      tryoutId: data.tryout_id,
      tryoutTitle: data.tryouts?.title || "Unknown",
      startedAt: data.started_at,
      completedAt: data.completed_at,
      durationMinutes: data.duration_minutes || 0,
      totalQuestions: data.total_questions || 0,
      correctCount: data.correct_count || 0,
      wrongCount: data.wrong_count || 0,
      unansweredCount: data.unanswered_count || 0,
      score: data.score || 0,
      xpEarned: data.xp_earned || 0,
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

