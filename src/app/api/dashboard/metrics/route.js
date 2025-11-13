import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/dashboard/metrics
 * Get dashboard performance metrics
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // Get all attempts
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("tryout_attempts")
      .select("score, completed_at, duration_minutes, xp_earned");
    if (attemptsError) throw attemptsError;

    const attempts = attemptsData || [];
    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(
      (a) => a.completed_at !== null
    );

    // Calculate average score (only from completed attempts with score > 0)
    const scoresWithValue = completedAttempts
      .map((a) => a.score)
      .filter((s) => s !== null && s !== undefined && s >= 0);
    const averageScore =
      scoresWithValue.length > 0
        ? scoresWithValue.reduce((sum, score) => sum + score, 0) /
          scoresWithValue.length
        : 0;

    // Calculate completion rate
    const completionRate =
      totalAttempts > 0
        ? (completedAttempts.length / totalAttempts) * 100
        : 0;

    // Calculate average duration (only from completed attempts with duration)
    const durationsWithValue = completedAttempts
      .map((a) => a.duration_minutes)
      .filter((d) => d !== null && d !== undefined && d > 0);
    const averageDuration =
      durationsWithValue.length > 0
        ? durationsWithValue.reduce((sum, dur) => sum + dur, 0) /
          durationsWithValue.length
        : 0;

    // Calculate total XP earned
    const totalXpEarned =
      attempts.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;

    const metrics = {
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
      averageDuration: Math.round(averageDuration), // Round to integer
      totalXpEarned: totalXpEarned,
    };

    return NextResponse.json({ data: metrics });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

