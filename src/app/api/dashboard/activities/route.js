import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/dashboard/activities
 * Get recent admin activities
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();

    // Get recent admin activities with join to admins
    const { data: activitiesData, error: activitiesError } = await supabase
      .from("admin_activity_logs")
      .select(
        "id, action_type, resource_type, description, created_at, admin_id, admins(full_name, username)"
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (activitiesError) throw activitiesError;

    const mapped = (activitiesData || []).map((activity) => ({
      id: activity.id,
      adminName: activity.admins?.full_name || activity.admins?.username || "Unknown Admin",
      actionType: activity.action_type,
      resourceType: activity.resource_type,
      description: activity.description || "",
      createdAt: activity.created_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

