import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/dashboard/attempts
 * Get recent tryout attempts
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // Get recent attempts with joins to tryouts and user_profiles
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("tryout_attempts")
      .select(
        "id, score, completed_at, duration_minutes, created_at, tryout_id, user_id, tryouts(title), user_profiles(name, email)"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (attemptsError) throw attemptsError;

    const mapped = (attemptsData || []).map((attempt) => ({
      id: attempt.id,
      userName: attempt.user_profiles?.name || attempt.user_profiles?.email || "Unknown",
      tryoutTitle: attempt.tryouts?.title || "Unknown Tryout",
      tryoutId: attempt.tryout_id,
      score: attempt.score || 0,
      completedAt: attempt.completed_at,
      duration: attempt.duration_minutes || 0,
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

