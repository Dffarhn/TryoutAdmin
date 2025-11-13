import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";

/**
 * GET /api/packages/[id]/tryouts
 * Get all tryouts that use this package
 */
export async function GET(_req, { params }) {
  try {
    const { id: packageId } = await params;

    if (!packageId) {
      return NextResponse.json(
        { error: "Package ID required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("tryouts")
      .select(
        "id,title,description,duration_minutes,is_active,package_id,created_at,updated_at,packages(name)"
      )
      .eq("package_id", packageId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map to include package name at top-level for UI convenience
    const mapped = (data || []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      durationMinutes: t.duration_minutes,
      isActive: t.is_active,
      packageId: t.package_id,
      packageName: t.packages?.name || "",
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

