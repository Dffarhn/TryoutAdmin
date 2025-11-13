import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/user-subscriptions/active
 * Get active subscriptions untuk user tertentu
 * Query parameter: user_id (required)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        id,
        user_id,
        subscription_type_id,
        transaction_id,
        started_at,
        expires_at,
        is_active,
        created_at,
        updated_at,
        subscription_types(id, name, price, duration_days, features)
      `)
      .eq("user_id", userId)
      .eq("is_active", true)
      .gt("expires_at", now)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((us) => ({
      id: us.id,
      userId: us.user_id,
      subscriptionTypeId: us.subscription_type_id,
      subscriptionTypeName: us.subscription_types?.name || "Unknown",
      subscriptionTypeFeatures: us.subscription_types?.features || {},
      transactionId: us.transaction_id,
      startedAt: us.started_at,
      expiresAt: us.expires_at,
      isActive: us.is_active ?? true,
      createdAt: us.created_at,
      updatedAt: us.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

