import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { tryoutSessionSchema } from "@/lib/validations/tryoutSessionSchema";

/**
 * GET /api/tryout-sessions/[id]
 * Get single session
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("tryout_sessions")
      .select(`
        id,
        package_id,
        subscription_type_id,
        available_until,
        is_active,
        created_at,
        updated_at,
        packages(id, name),
        subscription_types(id, name)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resp = {
      id: data.id,
      packageId: data.package_id,
      packageName: data.packages?.name || "Unknown",
      subscriptionTypeId: data.subscription_type_id,
      subscriptionTypeName: data.subscription_types?.name || "Unknown",
      availableUntil: data.available_until,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tryout-sessions/[id]
 * Update session (requires admin auth)
 */
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
      .from("tryout_sessions")
      .select("is_active, available_until, packages(name), subscription_types(name)")
      .eq("id", id)
      .maybeSingle();

    if (!oldData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (body.isActive !== undefined) {
      payload.is_active = body.isActive;
    }
    if (body.availableUntil !== undefined) {
      payload.available_until = body.availableUntil || null;
    }

    const { data, error } = await supabase
      .from("tryout_sessions")
      .update(payload)
      .eq("id", id)
      .select(`
        id,
        package_id,
        subscription_type_id,
        available_until,
        is_active,
        created_at,
        updated_at,
        packages(id, name),
        subscription_types(id, name)
      `)
      .single();

    if (error) throw error;

    const resp = {
      id: data.id,
      packageId: data.package_id,
      packageName: data.packages?.name || "Unknown",
      subscriptionTypeId: data.subscription_type_id,
      subscriptionTypeName: data.subscription_types?.name || "Unknown",
      availableUntil: data.available_until,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.TRYOUT_SESSION,
      resourceId: id,
      description: `Mengupdate relasi package ${resp.packageName} dengan subscription type ${resp.subscriptionTypeName}`,
      metadata: {
        old_values: {
          isActive: oldData.is_active,
          availableUntil: oldData.available_until,
        },
        new_values: {
          isActive: resp.isActive,
          availableUntil: resp.availableUntil,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tryout-sessions/[id]
 * Delete session (requires admin auth)
 */
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

    // Get session info for logging
    const { data: sessionData } = await supabase
      .from("tryout_sessions")
      .select("packages(name), subscription_types(name)")
      .eq("id", id)
      .maybeSingle();

    if (!sessionData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Note: Since tryout_attempts doesn't have tryout_session_id column,
    // we can't check if session is used by attempts. Session can be deleted freely.

    const { error } = await supabase.from("tryout_sessions").delete().eq("id", id);

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.TRYOUT_SESSION,
      resourceId: id,
      description: `Menghapus relasi package ${sessionData.packages?.name || "Unknown"} dengan subscription type ${sessionData.subscription_types?.name || "Unknown"}`,
      metadata: {
        old_values: {
          packageName: sessionData.packages?.name,
          subscriptionTypeName: sessionData.subscription_types?.name,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

