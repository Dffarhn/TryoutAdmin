import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // Get tryouts stats
    const { data: tryoutsData, error: tryoutsError } = await supabase
      .from("tryouts")
      .select("id, is_active");
    if (tryoutsError) throw tryoutsError;

    const tryoutsTotal = tryoutsData?.length || 0;
    const tryoutsActive = tryoutsData?.filter((t) => t.is_active).length || 0;
    const tryoutsInactive = tryoutsTotal - tryoutsActive;

    // Get packages stats
    const { data: packagesData, error: packagesError } = await supabase
      .from("packages")
      .select("id, is_active");
    if (packagesError) throw packagesError;

    const packagesTotal = packagesData?.length || 0;
    const packagesActive = packagesData?.filter((p) => p.is_active).length || 0;
    const packagesInactive = packagesTotal - packagesActive;

    // Get categories count
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true });
    if (categoriesError) throw categoriesError;

    // Get questions count (from pool, tryout_id IS NULL)
    const { count: questionsCount, error: questionsError } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });
    if (questionsError) throw questionsError;

    // Get sub-chapters count
    const { count: subChaptersCount, error: subChaptersError } = await supabase
      .from("sub_chapters")
      .select("*", { count: "exact", head: true });
    if (subChaptersError) throw subChaptersError;

    // Get attempts stats
    const { data: attemptsData, error: attemptsError } = await supabase
      .from("tryout_attempts")
      .select("id, completed_at");
    if (attemptsError) throw attemptsError;

    const attemptsTotal = attemptsData?.length || 0;
    const attemptsCompleted =
      attemptsData?.filter((a) => a.completed_at !== null).length || 0;
    const attemptsInProgress = attemptsTotal - attemptsCompleted;

    // Get unique active users (users who have at least one attempt)
    const { data: uniqueUsers, error: usersError } = await supabase
      .from("tryout_attempts")
      .select("user_id")
      .not("user_id", "is", null);
    if (usersError) throw usersError;

    const uniqueUserIds = new Set(
      (uniqueUsers || []).map((u) => u.user_id)
    );
    const activeUsers = uniqueUserIds.size;

    // Get subscription types stats
    const { data: subscriptionTypesData, error: subscriptionTypesError } = await supabase
      .from("subscription_types")
      .select("id, is_active");
    if (subscriptionTypesError) throw subscriptionTypesError;

    const subscriptionTypesTotal = subscriptionTypesData?.length || 0;
    const subscriptionTypesActive = subscriptionTypesData?.filter((st) => st.is_active).length || 0;
    const subscriptionTypesInactive = subscriptionTypesTotal - subscriptionTypesActive;

    // Get transactions stats
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("id, payment_status");
    if (transactionsError) throw transactionsError;

    const transactionsTotal = transactionsData?.length || 0;
    const transactionsPaid = transactionsData?.filter((t) => t.payment_status === "paid").length || 0;
    const transactionsPending = transactionsData?.filter((t) => t.payment_status === "pending").length || 0;

    // Get user subscriptions stats
    const { data: userSubscriptionsData, error: userSubscriptionsError } = await supabase
      .from("user_subscriptions")
      .select("id, is_active, expires_at");
    if (userSubscriptionsError) throw userSubscriptionsError;

    const now = new Date().toISOString();
    const userSubscriptionsTotal = userSubscriptionsData?.length || 0;
    const userSubscriptionsActive = userSubscriptionsData?.filter(
      (us) => us.is_active && new Date(us.expires_at) > new Date(now)
    ).length || 0;
    const userSubscriptionsExpired = userSubscriptionsTotal - userSubscriptionsActive;

    // Get tryout sessions stats
    const { data: tryoutSessionsData, error: tryoutSessionsError } = await supabase
      .from("tryout_sessions")
      .select("id, is_active");
    if (tryoutSessionsError) throw tryoutSessionsError;

    const tryoutSessionsTotal = tryoutSessionsData?.length || 0;
    const tryoutSessionsActive = tryoutSessionsData?.filter((ts) => ts.is_active).length || 0;

    const stats = {
      tryouts: {
        total: tryoutsTotal,
        active: tryoutsActive,
        inactive: tryoutsInactive,
      },
      packages: {
        total: packagesTotal,
        active: packagesActive,
        inactive: packagesInactive,
      },
      categories: categoriesCount || 0,
      questions: questionsCount || 0,
      subChapters: subChaptersCount || 0,
      attempts: {
        total: attemptsTotal,
        completed: attemptsCompleted,
        inProgress: attemptsInProgress,
      },
      activeUsers: activeUsers,
      subscriptionTypes: {
        total: subscriptionTypesTotal,
        active: subscriptionTypesActive,
        inactive: subscriptionTypesInactive,
      },
      transactions: {
        total: transactionsTotal,
        paid: transactionsPaid,
        pending: transactionsPending,
      },
      userSubscriptions: {
        total: userSubscriptionsTotal,
        active: userSubscriptionsActive,
        expired: userSubscriptionsExpired,
      },
      tryoutSessions: {
        total: tryoutSessionsTotal,
        active: tryoutSessionsActive,
        inactive: tryoutSessionsTotal - tryoutSessionsActive,
      },
    };

    return NextResponse.json({ data: stats });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

