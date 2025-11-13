import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { subscriptionTypeSchema } from "@/lib/validations/subscriptionTypeSchema";

/**
 * GET /api/subscription-types
 * List semua subscription types
 */
export async function GET() {
  try {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("subscription_types")
      .select("id, name, description, price, duration_days, features, is_active, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const mapped = (data || []).map((st) => ({
      id: st.id,
      name: st.name,
      description: st.description || "",
      price: parseFloat(st.price || 0),
      durationDays: st.duration_days || 30,
      features: st.features || {},
      isActive: st.is_active ?? true,
      createdAt: st.created_at,
      updatedAt: st.updated_at,
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
 * POST /api/subscription-types
 * Create subscription type baru (requires admin auth)
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

    // Validate input
    const validated = subscriptionTypeSchema.parse({
      name: body.name,
      description: body.description,
      price: body.price,
      durationDays: body.durationDays,
      features: body.features,
      isActive: body.isActive,
    });

    const payload = {
      name: validated.name,
      description: validated.description?.trim() || null,
      price: validated.price,
      duration_days: validated.durationDays,
      features: validated.features || null,
      is_active: validated.isActive ?? true,
    };

    const { data, error } = await supabase
      .from("subscription_types")
      .insert(payload)
      .select("id, name, description, price, duration_days, features, is_active, created_at, updated_at")
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Subscription type dengan nama tersebut sudah ada" },
          { status: 400 }
        );
      }
      throw error;
    }

    const resp = {
      id: data.id,
      name: data.name,
      description: data.description || "",
      price: parseFloat(data.price || 0),
      durationDays: data.duration_days || 30,
      features: data.features || {},
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.SUBSCRIPTION_TYPE,
      resourceId: resp.id,
      description: `Membuat subscription type: ${resp.name}`,
      metadata: {
        new_values: {
          name: resp.name,
          price: resp.price,
          durationDays: resp.durationDays,
          isActive: resp.isActive,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ data: resp }, { status: 201 });
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

