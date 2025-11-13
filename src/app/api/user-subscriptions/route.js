import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";

/**
 * GET /api/user-subscriptions
 * List subscriptions (dengan filter user_id, is_active)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const isActive = searchParams.get("is_active");

    const supabase = getSupabaseServer();
    let query = supabase
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
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (isActive !== null && isActive !== undefined) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error } = await query;

    if (error) throw error;

    const mapped = (data || []).map((us) => ({
      id: us.id,
      userId: us.user_id,
      userName: us.user_profiles?.name || us.user_profiles?.email || "Unknown",
      subscriptionTypeId: us.subscription_type_id,
      subscriptionTypeName: us.subscription_types?.name || "Unknown",
      transactionId: us.transaction_id,
      transactionAmount: parseFloat(us.transactions?.amount || 0),
      startedAt: us.started_at,
      expiresAt: us.expires_at,
      isActive: us.is_active ?? true,
      createdAt: us.created_at,
      updatedAt: us.updated_at,
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
 * POST /api/user-subscriptions
 * Create subscription manual (opsional, biasanya auto dari transaction)
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

    // Validate required fields
    if (!body.userId || !body.subscriptionTypeId) {
      return NextResponse.json(
        { error: "userId dan subscriptionTypeId wajib diisi" },
        { status: 400 }
      );
    }

    // Get subscription type untuk mendapatkan duration_days dan price
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

    // Check if user already has an active subscription
    const { data: existingSubscription, error: checkError } = await supabase
      .from("user_subscriptions")
      .select("id, subscription_type_id, is_active, expires_at, subscription_types(name)")
      .eq("user_id", body.userId)
      .eq("is_active", true)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: `Gagal mengecek subscription: ${checkError.message}` },
        { status: 500 }
      );
    }

    // If user already has active subscription, update it instead of creating new
    if (existingSubscription) {
      // Auto-create transaction for the change
      const durationDays = subscriptionType.duration_days || 30;
      const now = new Date();
      const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
      const expiresAt = body.expiresAt 
        ? new Date(body.expiresAt)
        : new Date(new Date(startedAt).setDate(startedAt.getDate() + durationDays));

      const transactionPayload = {
        user_id: body.userId,
        subscription_type_id: body.subscriptionTypeId,
        amount: parseFloat(subscriptionType.price || 0),
        payment_method: "manual_admin",
        payment_status: "paid",
        paid_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata: {
          source: "admin_change_subscription",
          admin_user_id: adminUser.userId,
          previous_subscription_id: existingSubscription.id,
        },
      };

      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionPayload)
        .select("id")
        .single();

      if (transactionError) {
        return NextResponse.json(
          { error: `Gagal membuat transaction: ${transactionError.message}` },
          { status: 500 }
        );
      }

      // Update existing subscription
      const updatePayload = {
        subscription_type_id: body.subscriptionTypeId,
        transaction_id: transactionData.id,
        started_at: startedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: body.isActive !== undefined ? body.isActive : true,
        updated_at: now.toISOString(),
      };

      const { data: updatedData, error: updateError } = await supabase
        .from("user_subscriptions")
        .update(updatePayload)
        .eq("id", existingSubscription.id)
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

      if (updateError) throw updateError;

      const resp = {
        id: updatedData.id,
        userId: updatedData.user_id,
        userName: updatedData.user_profiles?.name || updatedData.user_profiles?.email || "Unknown",
        subscriptionTypeId: updatedData.subscription_type_id,
        subscriptionTypeName: updatedData.subscription_types?.name || "Unknown",
        transactionId: updatedData.transaction_id,
        startedAt: updatedData.started_at,
        expiresAt: updatedData.expires_at,
        isActive: updatedData.is_active ?? true,
        createdAt: updatedData.created_at,
        updatedAt: updatedData.updated_at,
      };

      return NextResponse.json({ data: resp, message: "Subscription berhasil diupdate (user hanya boleh punya 1 subscription aktif)" });
    }

    // Auto-create transaction for manual admin assignment (new subscription)
    let transactionId = body.transactionId;
    if (!transactionId) {
      const durationDays = subscriptionType.duration_days || 30;
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + durationDays);

      const transactionPayload = {
        user_id: body.userId,
        subscription_type_id: body.subscriptionTypeId,
        amount: parseFloat(subscriptionType.price || 0),
        payment_method: "manual_admin",
        payment_status: "paid", // Auto-paid for admin assignment
        paid_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata: {
          source: "admin_manual_assignment",
          admin_user_id: adminUser.userId,
        },
      };

      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert(transactionPayload)
        .select("id")
        .single();

      if (transactionError) {
        return NextResponse.json(
          { error: `Gagal membuat transaction: ${transactionError.message}` },
          { status: 500 }
        );
      }

      transactionId = transactionData.id;
    } else {
      // Check if provided transaction exists
      const { data: transaction, error: transError } = await supabase
        .from("transactions")
        .select("id, payment_status")
        .eq("id", transactionId)
        .single();

      if (transError || !transaction) {
        return NextResponse.json(
          { error: "Transaction tidak ditemukan" },
          { status: 400 }
        );
      }
    }

    const durationDays = subscriptionType.duration_days || 30;
    const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
    const expiresAt = body.expiresAt 
      ? new Date(body.expiresAt) 
      : new Date(new Date(startedAt).setDate(startedAt.getDate() + durationDays));

    const payload = {
      user_id: body.userId,
      subscription_type_id: body.subscriptionTypeId,
      transaction_id: transactionId,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: body.isActive !== undefined ? body.isActive : true,
    };

    const { data, error } = await supabase
      .from("user_subscriptions")
      .insert(payload)
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

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Subscription untuk transaction ini sudah ada" },
          { status: 400 }
        );
      }
      throw error;
    }

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

    return NextResponse.json({ data: resp }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: String(e?.message || e) },
      { status: 500 }
    );
  }
}

