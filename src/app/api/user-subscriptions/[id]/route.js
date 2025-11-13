import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";

/**
 * GET /api/user-subscriptions/[id]
 * Get single subscription
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
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
        user_profiles(id, name, email),
        subscription_types(id, name, price, duration_days),
        transactions(id, amount, payment_status)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const resp = {
      id: data.id,
      userId: data.user_id,
      userName: data.user_profiles?.name || data.user_profiles?.email || "Unknown",
      subscriptionTypeId: data.subscription_type_id,
      subscriptionTypeName: data.subscription_types?.name || "Unknown",
      transactionId: data.transaction_id,
      transactionAmount: parseFloat(data.transactions?.amount || 0),
      startedAt: data.started_at,
      expiresAt: data.expires_at,
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
 * PATCH /api/user-subscriptions/[id]
 * Update subscription (requires admin auth)
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
      .from("user_subscriptions")
      .select("is_active, expires_at, subscription_type_id, user_profiles(name, email), subscription_types(name)")
      .eq("id", id)
      .maybeSingle();

    if (!oldData) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (body.subscriptionTypeId !== undefined) {
      // Validate subscription type exists
      const { data: subscriptionType, error: subTypeError } = await supabase
        .from("subscription_types")
        .select("id, duration_days, price")
        .eq("id", body.subscriptionTypeId)
        .single();

      if (subTypeError || !subscriptionType) {
        return NextResponse.json(
          { error: "Subscription type tidak ditemukan" },
          { status: 400 }
        );
      }

      const oldSubscriptionTypeId = oldData?.subscription_type_id;
      const isSubscriptionTypeChanged = oldSubscriptionTypeId !== body.subscriptionTypeId;

      payload.subscription_type_id = body.subscriptionTypeId;

      // If subscription type changed, recalculate expires_at based on duration_days
      if (body.recalculateExpiresAt !== false) {
        const { data: currentData } = await supabase
          .from("user_subscriptions")
          .select("started_at")
          .eq("id", id)
          .single();

        const startedAt = currentData?.started_at 
          ? new Date(currentData.started_at)
          : new Date();
        
        const durationDays = subscriptionType.duration_days || 30;
        const newExpiresAt = new Date(startedAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);
        payload.expires_at = newExpiresAt.toISOString();
      }

      // Auto-create transaction if subscription type changed or extended
      if (isSubscriptionTypeChanged || body.expiresAt !== undefined) {
        const { data: userData } = await supabase
          .from("user_subscriptions")
          .select("user_id")
          .eq("id", id)
          .single();

        if (userData) {
          const now = new Date();
          const expiresAt = payload.expires_at 
            ? new Date(payload.expires_at)
            : (oldData?.expires_at ? new Date(oldData.expires_at) : new Date());

          const transactionPayload = {
            user_id: userData.user_id,
            subscription_type_id: body.subscriptionTypeId,
            amount: parseFloat(subscriptionType.price || 0),
            payment_method: "manual_admin",
            payment_status: "paid",
            paid_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            metadata: {
              source: isSubscriptionTypeChanged ? "admin_change_subscription" : "admin_extend_subscription",
              admin_user_id: adminUser.userId,
              original_subscription_id: id,
            },
          };

          const { data: transactionData, error: transactionError } = await supabase
            .from("transactions")
            .insert(transactionPayload)
            .select("id")
            .single();

          if (transactionError) {
            console.error("Error creating transaction:", transactionError);
            // Don't fail the update, but log the error
          } else {
            // Update subscription with new transaction_id
            payload.transaction_id = transactionData.id;
          }
        }
      }
    }
    if (body.isActive !== undefined) {
      payload.is_active = body.isActive;
    }
    if (body.expiresAt !== undefined) {
      payload.expires_at = body.expiresAt;
    }
    if (body.startedAt !== undefined) {
      payload.started_at = body.startedAt;
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .update(payload)
      .eq("id", id)
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
        user_profiles(id, name, email),
        subscription_types(id, name)
      `)
      .single();

    if (error) throw error;

    const resp = {
      id: data.id,
      userId: data.user_id,
      userName: data.user_profiles?.name || data.user_profiles?.email || "Unknown",
      subscriptionTypeId: data.subscription_type_id,
      subscriptionTypeName: data.subscription_types?.name || "Unknown",
      transactionId: data.transaction_id,
      startedAt: data.started_at,
      expiresAt: data.expires_at,
      isActive: data.is_active ?? true,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Log activity
    const oldSubscriptionTypeName = oldData?.subscription_types?.name || "Unknown";
    const description = body.subscriptionTypeId && body.subscriptionTypeId !== oldData?.subscription_type_id
      ? `Mengubah subscription ${oldSubscriptionTypeName} menjadi ${resp.subscriptionTypeName} untuk ${resp.userName}`
      : `Mengupdate subscription untuk ${resp.userName}`;

    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.USER_SUBSCRIPTION,
      resourceId: id,
      description,
      metadata: {
        old_values: {
          isActive: oldData?.is_active,
          expiresAt: oldData?.expires_at,
          subscriptionTypeId: oldData?.subscription_type_id,
          subscriptionTypeName: oldSubscriptionTypeName,
        },
        new_values: {
          isActive: resp.isActive,
          expiresAt: resp.expiresAt,
          subscriptionTypeId: resp.subscriptionTypeId,
          subscriptionTypeName: resp.subscriptionTypeName,
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

