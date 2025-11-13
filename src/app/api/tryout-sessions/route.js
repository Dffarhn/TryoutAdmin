import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { tryoutSessionSchema } from "@/lib/validations/tryoutSessionSchema";

/**
 * GET /api/tryout-sessions
 * List sessions (dengan filter subscription_type_id, package_id)
 * Relasi antara package dengan subscription_type
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionTypeId = searchParams.get("subscription_type_id");
    const packageId = searchParams.get("package_id");
    const isActive = searchParams.get("is_active");

    const supabase = getSupabaseServer();
    let query = supabase
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
      .order("created_at", { ascending: false });

    if (subscriptionTypeId) {
      query = query.eq("subscription_type_id", subscriptionTypeId);
    }
    if (packageId) {
      query = query.eq("package_id", packageId);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((ts) => ({
      id: ts.id,
      packageId: ts.package_id,
      packageName: ts.packages?.name || "Unknown",
      subscriptionTypeId: ts.subscription_type_id,
      subscriptionTypeName: ts.subscription_types?.name || "Unknown",
      availableUntil: ts.available_until,
      isActive: ts.is_active ?? true,
      createdAt: ts.created_at,
      updatedAt: ts.updated_at,
    }));

    return NextResponse.json({ data: mapped });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tryout-sessions
 * Create relasi baru antara package dengan subscription_type
 * Support single atau bulk create (array)
 */
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

    // Support both single object and array
    const items = Array.isArray(body) ? body : [body];
    const validatedItems = [];

    // Validate all items
    for (const item of items) {
      try {
        const validated = tryoutSessionSchema.parse({
          packageId: item.packageId,
          subscriptionTypeId: item.subscriptionTypeId,
          availableUntil: item.availableUntil,
          isActive: item.isActive,
        });
        validatedItems.push(validated);
      } catch (e) {
        if (e.name === "ZodError") {
          return NextResponse.json(
            { error: e.errors[0]?.message || "Validation error" },
            { status: 400 }
          );
        }
        throw e;
      }
    }

    // Prepare payloads
    const payloads = validatedItems.map((validated) => ({
      package_id: validated.packageId,
      subscription_type_id: validated.subscriptionTypeId,
      available_until: validated.availableUntil || null,
      is_active: validated.isActive ?? true,
    }));

    // Insert all at once
    const { data, error } = await supabase
      .from("tryout_sessions")
      .insert(payloads)
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
      `);

    if (error) {
      // Handle duplicate entry
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Salah satu atau lebih relasi package dengan subscription type sudah ada" },
          { status: 400 }
        );
      }
      throw error;
    }

    const responses = (data || []).map((item) => ({
      id: item.id,
      packageId: item.package_id,
      packageName: item.packages?.name || "Unknown",
      subscriptionTypeId: item.subscription_type_id,
      subscriptionTypeName: item.subscription_types?.name || "Unknown",
      availableUntil: item.available_until,
      isActive: item.is_active ?? true,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    // Log activity for each created session
    for (const resp of responses) {
      await logAdminActivity({
        userId: adminUser.userId,
        actionType: ActionTypes.CREATE,
        resourceType: ResourceTypes.TRYOUT_SESSION,
        resourceId: resp.id,
        description: `Menghubungkan package ${resp.packageName} dengan subscription type ${resp.subscriptionTypeName}`,
        metadata: {
          new_values: {
            packageId: resp.packageId,
            subscriptionTypeId: resp.subscriptionTypeId,
            isActive: resp.isActive,
          },
        },
        ipAddress,
        userAgent,
      });
    }

    // Return single object if single input, array if bulk
    if (Array.isArray(body)) {
      return NextResponse.json({ data: responses }, { status: 201 });
    } else {
      return NextResponse.json({ data: responses[0] }, { status: 201 });
    }
  } catch (e) {
    if (e.name === "ZodError") {
      return NextResponse.json(
        { error: e.errors[0]?.message || "Validation error" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

