import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";

/**
 * GET /api/users
 * List users dengan subscriptions mereka
 */
export async function GET(request) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const supabase = getSupabaseServer();

    // Get all users
    let userQuery = supabase
      .from("user_profiles")
      .select("id, name, email, created_at")
      .order("created_at", { ascending: false });

    if (search) {
      userQuery = userQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const userIds = users.map((u) => u.id);

    // Get active subscriptions for these users
    const { data: subscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_type_id,
        started_at,
        expires_at,
        is_active,
        subscription_types(id, name, price, duration_days)
      `)
      .in("user_id", userIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (subsError) throw subsError;

    // Group subscriptions by user_id
    const subscriptionsByUser = {};
    (subscriptions || []).forEach((sub) => {
      if (!subscriptionsByUser[sub.user_id]) {
        subscriptionsByUser[sub.user_id] = [];
      }
      subscriptionsByUser[sub.user_id].push({
        id: sub.id,
        subscriptionTypeId: sub.subscription_type_id,
        subscriptionTypeName: sub.subscription_types?.name || "Unknown",
        subscriptionTypePrice: parseFloat(sub.subscription_types?.price || 0),
        startedAt: sub.started_at,
        expiresAt: sub.expires_at,
        isActive: sub.is_active ?? true,
        isExpired: new Date(sub.expires_at) < new Date(),
      });
    });

    // Map users with their subscriptions
    const mapped = (users || []).map((user) => ({
      id: user.id,
      name: user.name || "Unknown",
      email: user.email || "No email",
      createdAt: user.created_at,
      subscriptions: subscriptionsByUser[user.id] || [],
      hasActiveSubscription: subscriptionsByUser[user.id]?.some(
        (sub) => sub.isActive && !sub.isExpired
      ) || false,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

