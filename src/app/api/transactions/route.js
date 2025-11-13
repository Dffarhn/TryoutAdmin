import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { transactionSchema } from "@/lib/validations/transactionSchema";

/**
 * GET /api/transactions
 * List semua transactions (dengan filter user_id, payment_status)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const paymentStatus = searchParams.get("payment_status");

    const supabase = getSupabaseServer();
    let query = supabase
      .from("transactions")
      .select(`
        id,
        user_id,
        subscription_type_id,
        amount,
        payment_method,
        payment_status,
        paid_at,
        expires_at,
        metadata,
        created_at,
        updated_at,
        user_profiles(id, name, email),
        subscription_types(id, name, price)
      `)
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (paymentStatus) {
      query = query.eq("payment_status", paymentStatus);
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      userName: t.user_profiles?.name || t.user_profiles?.email || "Unknown",
      subscriptionTypeId: t.subscription_type_id,
      subscriptionTypeName: t.subscription_types?.name || "Unknown",
      amount: parseFloat(t.amount || 0),
      paymentMethod: t.payment_method || "",
      paymentStatus: t.payment_status || "pending",
      paidAt: t.paid_at,
      expiresAt: t.expires_at,
      metadata: t.metadata || {},
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

/**
 * POST /api/transactions
 * Create transaction baru (admin manual, bisa langsung paid atau pending)
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
    const validated = transactionSchema.parse({
      userId: body.userId,
      subscriptionTypeId: body.subscriptionTypeId,
      amount: body.amount,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentStatus || "pending",
      metadata: body.metadata,
    });

    // Get subscription type untuk mendapatkan duration_days
    const { data: subscriptionType, error: subTypeError } = await supabase
      .from("subscription_types")
      .select("id, duration_days")
      .eq("id", validated.subscriptionTypeId)
      .single();

    if (subTypeError || !subscriptionType) {
      return NextResponse.json(
        { error: "Subscription type tidak ditemukan" },
        { status: 400 }
      );
    }

    const durationDays = subscriptionType.duration_days || 30;
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const payload = {
      user_id: validated.userId,
      subscription_type_id: validated.subscriptionTypeId,
      amount: validated.amount,
      payment_method: validated.paymentMethod || null,
      payment_status: validated.paymentStatus,
      paid_at: validated.paymentStatus === "paid" ? now.toISOString() : null,
      expires_at: expiresAt.toISOString(),
      metadata: validated.metadata || null,
    };

    const { data, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select(`
        id,
        user_id,
        subscription_type_id,
        amount,
        payment_method,
        payment_status,
        paid_at,
        expires_at,
        metadata,
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
      amount: parseFloat(data.amount || 0),
      paymentMethod: data.payment_method || "",
      paymentStatus: data.payment_status || "pending",
      paidAt: data.paid_at,
      expiresAt: data.expires_at,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    // Jika payment status = 'paid', auto-create atau update user_subscription
    if (validated.paymentStatus === "paid") {
      // Check if user already has an active subscription
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("user_id", validated.userId)
        .eq("is_active", true)
        .maybeSingle();

      if (existingSubscription) {
        // Update existing subscription instead of creating new
        const updatePayload = {
          subscription_type_id: validated.subscriptionTypeId,
          transaction_id: data.id,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          updated_at: now.toISOString(),
        };

        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .update(updatePayload)
          .eq("id", existingSubscription.id)
          .select("id")
          .single();

        if (subscriptionError) {
          console.error("Error updating user_subscription:", subscriptionError);
        } else {
          resp.userSubscriptionId = subscriptionData.id;
          resp.subscriptionUpdated = true;
        }
      } else {
        // Create new subscription
        const subscriptionPayload = {
          user_id: validated.userId,
          subscription_type_id: validated.subscriptionTypeId,
          transaction_id: data.id,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
        };

        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("user_subscriptions")
          .insert(subscriptionPayload)
          .select("id")
          .single();

        if (subscriptionError) {
          console.error("Error creating user_subscription:", subscriptionError);
        } else {
          resp.userSubscriptionId = subscriptionData.id;
        }
      }
    }

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.CREATE,
      resourceType: ResourceTypes.TRANSACTION,
      resourceId: resp.id,
      description: `Membuat transaction: ${resp.amount} untuk ${resp.userName}`,
      metadata: {
        new_values: {
          userId: resp.userId,
          subscriptionTypeId: resp.subscriptionTypeId,
          amount: resp.amount,
          paymentStatus: resp.paymentStatus,
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

