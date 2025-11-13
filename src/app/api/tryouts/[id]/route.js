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

export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("tryouts")
      .select(
        "id,title,description,duration_minutes,is_active,package_id,created_at,updated_at,packages(name)"
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Get old data for logging
    const { data: oldData } = await supabase
      .from("tryouts")
      .select("title,description,duration_minutes,is_active")
      .eq("id", id)
      .single();

    const packageId = body.packageName
      ? await ensureByName(supabase, "packages", body.packageName)
      : null;

    const payload = {
      ...(body.title !== undefined ? { title: (body.title || "").trim() } : {}),
      ...(body.description !== undefined ? { description: (body.description || "").trim() } : {}),
      ...(body.durationMinutes !== undefined ? { duration_minutes: Number(body.durationMinutes || 0) } : {}),
      ...(body.isActive !== undefined ? { is_active: !!body.isActive } : {}),
      ...(packageId !== null ? { package_id: packageId } : {}),
      // category_id dihapus - category sekarang ada di sub-chapter
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("tryouts")
      .update(payload)
      .eq("id", id)
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
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: id,
      description: `Mengupdate tryout: ${resp.title}`,
      metadata: {
        old_values: oldData,
        new_values: {
          title: resp.title,
          durationMinutes: resp.durationMinutes,
          isActive: resp.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Check admin user
    const adminUser = await getAdminUserFromRequest();
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseServer();
    const { ipAddress, userAgent } = getRequestInfo(request);

    // Get data before delete for logging
    const { data: oldData } = await supabase
      .from("tryouts")
      .select("title")
      .eq("id", id)
      .single();

    const { error } = await supabase.from("tryouts").delete().eq("id", id);
    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.TRYOUT,
      resourceId: id,
      description: `Menghapus tryout: ${oldData?.title || id}`,
      metadata: {
        old_values: oldData,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}


