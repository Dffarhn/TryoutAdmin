import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

async function ensureByName(supabase, table, name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return null;
  const { data: found, error: findErr } = await supabase
    .from(table)
    .select("id")
    .eq("name", trimmed)
    .maybeSingle();
  if (findErr) throw findErr;
  if (found) return found.id;
  const { data: inserted, error: insErr } = await supabase
    .from(table)
    .insert({ name: trimmed })
    .select("id")
    .single();
  if (insErr) throw insErr;
  return inserted.id;
}

export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("tryouts")
      .select(
        "id,title,description,duration_minutes,is_active,package_id,created_at,updated_at,packages(name)"
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    // map to include package name at top-level for UI convenience
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
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    const packageId = await ensureByName(supabase, "packages", body.packageName);

    const payload = {
      title: (body.title || "").trim(),
      description: (body.description || "").trim(),
      duration_minutes: Number(body.durationMinutes || 0),
      is_active: !!body.isActive,
      package_id: packageId,
      // category_id dihapus - category sekarang ada di sub-chapter
    };

    const { data, error } = await supabase
      .from("tryouts")
      .insert(payload)
      .select(
        "id,title,description,duration_minutes,is_active,package_id,created_at,updated_at,packages(name)"
      )
      .single();
    if (error) throw error;
    
    const resp = {
      id: data.id,
      title: data.title,
      description: data.description,
      durationMinutes: data.duration_minutes,
      isActive: data.is_active,
      packageId: data.package_id,
      packageName: data.packages?.name || "",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: resp.id,
      description: `Membuat tryout: ${resp.title}`,
      metadata: {
        new_values: {
          title: resp.title,
          durationMinutes: resp.durationMinutes,
          isActive: resp.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}


