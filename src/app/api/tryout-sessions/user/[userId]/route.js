import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/tryout-sessions/user/[userId]
 * Get available sessions untuk user (join dengan user_subscriptions)
 * Sesuai arsitektur: Query menggunakan join dari user_subscriptions berdasarkan subscription_type_id
 */
export async function GET(_req, { params }) {
  try {
    const { userId } = await params;
    const supabase = getSupabaseServer();
    const now = new Date().toISOString();

    // Query sesuai arsitektur: 
    // 1. Get active user subscriptions untuk user
    // 2. Get tryout_sessions untuk subscription_type_id dari user subscriptions
    const { data: userSubscriptions, error: subsError } = await supabase
      .from("user_subscriptions")
      .select("subscription_type_id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("expires_at", now);

    if (subsError) throw subsError;

    if (!userSubscriptions || userSubscriptions.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const subscriptionTypeIds = userSubscriptions.map((us) => us.subscription_type_id);

    // Get tryout sessions untuk subscription types yang dimiliki user
    const { data: sessions, error } = await supabase
      .from("tryout_sessions")
      .select(`
        id,
        package_id,
        subscription_type_id,
        available_until,
        is_active,
        created_at,
        updated_at,
        packages(id, name, description),
        subscription_types(id, name)
      `)
      .in("subscription_type_id", subscriptionTypeIds)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Filter sessions yang available_until > now() jika ada
    const filtered = (sessions || []).filter((ts) => {
      if (ts.available_until) {
        return new Date(ts.available_until) > new Date(now);
      }
      return true; // Jika available_until null, berarti tidak ada batas waktu
    });

    // Get tryouts untuk setiap package
    const packageIds = [...new Set(filtered.map((ts) => ts.package_id))];
    const { data: tryoutsData, error: tryoutsError } = await supabase
      .from("tryouts")
      .select("id, package_id, title, description, duration_minutes")
      .in("package_id", packageIds);

    if (tryoutsError) throw tryoutsError;

    // Group tryouts by package_id
    const tryoutsByPackage = {};
    (tryoutsData || []).forEach((tryout) => {
      if (!tryoutsByPackage[tryout.package_id]) {
        tryoutsByPackage[tryout.package_id] = [];
      }
      tryoutsByPackage[tryout.package_id].push(tryout);
    });

    // Flatten hasil: setiap session bisa punya multiple tryouts dari package
    const mapped = [];
    filtered.forEach((ts) => {
      const tryouts = tryoutsByPackage[ts.package_id] || [];
      if (tryouts.length === 0) {
        // Jika package tidak punya tryouts, tetap return session info
        mapped.push({
          id: ts.id,
          packageId: ts.package_id,
          packageName: ts.packages?.name || "Unknown",
          packageDescription: ts.packages?.description || "",
          subscriptionTypeId: ts.subscription_type_id,
          subscriptionTypeName: ts.subscription_types?.name || "Unknown",
          tryouts: [],
          availableUntil: ts.available_until,
          isActive: ts.is_active ?? true,
          createdAt: ts.created_at,
          updatedAt: ts.updated_at,
        });
      } else {
        // Return satu entry per tryout
        tryouts.forEach((tryout) => {
          mapped.push({
            id: ts.id,
            packageId: ts.package_id,
            packageName: ts.packages?.name || "Unknown",
            packageDescription: ts.packages?.description || "",
            tryoutId: tryout.id,
            tryoutTitle: tryout.title || "Unknown",
            tryoutDescription: tryout.description || "",
            tryoutDurationMinutes: tryout.duration_minutes || 0,
            subscriptionTypeId: ts.subscription_type_id,
            subscriptionTypeName: ts.subscription_types?.name || "Unknown",
            availableUntil: ts.available_until,
            isActive: ts.is_active ?? true,
            createdAt: ts.created_at,
            updatedAt: ts.updated_at,
          });
        });
      }
    });

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

