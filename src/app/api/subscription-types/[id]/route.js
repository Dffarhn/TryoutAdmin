import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { subscriptionTypeSchema } from "@/lib/validations/subscriptionTypeSchema";

/**
 * GET /api/subscription-types/[id]
 * Get single subscription type
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
      .from("subscription_types")
      .select("id, name, description, price, duration_days, features, is_active, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    return NextResponse.json({ data: resp });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/subscription-types/[id]
 * Update subscription type (requires admin auth)
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

    // Get old values for logging
    const { data: oldData } = await supabase
      .from("subscription_types")
      .select("name, description, price, duration_days, features, is_active")
      .eq("id", id)
      .maybeSingle();

    if (!oldData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build update payload
    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.durationDays !== undefined) updateData.durationDays = body.durationDays;
    if (body.features !== undefined) updateData.features = body.features;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Validate with schema (merge with old data)
    const validated = subscriptionTypeSchema.partial().parse({
      ...oldData,
      ...updateData,
      durationDays: updateData.durationDays ?? oldData.duration_days,
      isActive: updateData.isActive ?? oldData.is_active,
    });

    const payload = {
      updated_at: new Date().toISOString(),
    };
    if (validated.name !== undefined) payload.name = validated.name;
    if (validated.description !== undefined) payload.description = validated.description?.trim() || null;
    if (validated.price !== undefined) payload.price = validated.price;
    if (validated.durationDays !== undefined) payload.duration_days = validated.durationDays;
    if (validated.features !== undefined) payload.features = validated.features || null;
    if (validated.isActive !== undefined) payload.is_active = validated.isActive;

    const { data, error } = await supabase
      .from("subscription_types")
      .update(payload)
      .eq("id", id)
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

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.SUBSCRIPTION_TYPE,
      resourceId: id,
      description: `Mengupdate subscription type: ${resp.name}`,
      metadata: {
        old_values: {
          name: oldData.name,
          price: parseFloat(oldData.price || 0),
          durationDays: oldData.duration_days,
          isActive: oldData.is_active,
        },
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

    return NextResponse.json({ data: resp });
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

/**
 * DELETE /api/subscription-types/[id]
 * Delete subscription type (requires admin auth)
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

    // Get subscription type info for logging
    const { data: subscriptionTypeData } = await supabase
      .from("subscription_types")
      .select("name")
      .eq("id", id)
      .maybeSingle();

    if (!subscriptionTypeData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if subscription type is used by any transaction or user_subscription
    const { data: transactionsUsing, error: transactionsError } = await supabase
      .from("transactions")
      .select("id")
      .eq("subscription_type_id", id)
      .limit(1);

    if (transactionsError) throw transactionsError;

    if (transactionsUsing && transactionsUsing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Subscription type tidak bisa dihapus karena masih digunakan oleh transaksi",
        },
        { status: 400 }
      );
    }

    const { data: subscriptionsUsing, error: subscriptionsError } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("subscription_type_id", id)
      .limit(1);

    if (subscriptionsError) throw subscriptionsError;

    if (subscriptionsUsing && subscriptionsUsing.length > 0) {
      return NextResponse.json(
        {
          error:
            "Subscription type tidak bisa dihapus karena masih digunakan oleh user subscription",
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("subscription_types").delete().eq("id", id);

    if (error) throw error;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.SUBSCRIPTION_TYPE,
      resourceId: id,
      description: `Menghapus subscription type: ${subscriptionTypeData.name}`,
      metadata: {
        old_values: {
          name: subscriptionTypeData.name,
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

