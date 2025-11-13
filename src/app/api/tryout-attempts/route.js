import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/tryout-attempts
 * List tryout attempts (dengan filter user_id, tryout_id)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const tryoutId = searchParams.get("tryout_id");

    const supabase = getSupabaseServer();
    let query = supabase
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
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (tryoutId) {
      query = query.eq("tryout_id", tryoutId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((attempt) => ({
      id: attempt.id,
      userId: attempt.user_id,
      userName: attempt.user_profiles?.name || attempt.user_profiles?.email || "Unknown",
      tryoutId: attempt.tryout_id,
      tryoutTitle: attempt.tryouts?.title || "Unknown",
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      durationMinutes: attempt.duration_minutes || 0,
      totalQuestions: attempt.total_questions || 0,
      correctCount: attempt.correct_count || 0,
      wrongCount: attempt.wrong_count || 0,
      unansweredCount: attempt.unanswered_count || 0,
      score: attempt.score || 0,
      xpEarned: attempt.xp_earned || 0,
      createdAt: attempt.created_at,
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
 * POST /api/tryout-attempts
 * Create tryout attempt baru
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const supabase = getSupabaseServer();

    // Validate required fields
    if (!body.userId || !body.tryoutId) {
      return NextResponse.json(
        { error: "userId dan tryoutId wajib diisi" },
        { status: 400 }
      );
    }

    const payload = {
      user_id: body.userId,
      tryout_id: body.tryoutId,
      started_at: body.startedAt || new Date().toISOString(),
      score: body.score || 0,
      xp_earned: body.xpEarned || 0,
      correct_count: body.correctCount || 0,
      wrong_count: body.wrongCount || 0,
      unanswered_count: body.unansweredCount || 0,
      total_questions: body.totalQuestions || 0,
      duration_minutes: body.durationMinutes || null,
    };

    const { data, error } = await supabase
      .from("tryout_attempts")
      .insert(payload)
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

    return NextResponse.json({ data: resp }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

