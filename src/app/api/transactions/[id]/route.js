import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { getAdminUserFromRequest } from "@/lib/getAdminUser";
import { logAdminActivity, getRequestInfo, ActionTypes, ResourceTypes } from "@/lib/adminLogger";
import { transactionSchema } from "@/lib/validations/transactionSchema";

/**
 * GET /api/transactions/[id]
 * Get single transaction
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
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
      amount: parseFloat(data.amount || 0),
      paymentMethod: data.payment_method || "",
      paymentStatus: data.payment_status || "pending",
      paidAt: data.paid_at,
      expiresAt: data.expires_at,
      metadata: data.metadata || {},
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
 * PATCH /api/transactions/[id]
 * Update transaction (requires admin auth)
 * Auto-create user_subscription saat payment_status menjadi 'paid'
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

    // Get old transaction data
    const { data: oldTransaction, error: fetchError } = await supabase
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
        subscription_types(duration_days)
      `)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!oldTransaction) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const oldPaymentStatus = oldTransaction.payment_status;
    const newPaymentStatus = body.paymentStatus || oldPaymentStatus;

    // Build update payload
    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (body.paymentStatus !== undefined) {
      payload.payment_status = body.paymentStatus;
      if (body.paymentStatus === "paid" && oldPaymentStatus !== "paid") {
        payload.paid_at = new Date().toISOString();
      } else if (body.paymentStatus !== "paid" && oldPaymentStatus === "paid") {
        payload.paid_at = null;
      }
    }
    if (body.paymentMethod !== undefined) {
      payload.payment_method = body.paymentMethod || null;
    }
    if (body.amount !== undefined) {
      payload.amount = body.amount;
    }
    if (body.metadata !== undefined) {
      payload.metadata = body.metadata || null;
    }

    // Update transaction
    const { data: updatedTransaction, error: updateError } = await supabase
      .from("transactions")
      .update(payload)
      .eq("id", id)
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
      .single();

    if (updateError) throw updateError;

    const resp = {
      id: updatedTransaction.id,
      userId: updatedTransaction.user_id,
      userName: updatedTransaction.user_profiles?.name || updatedTransaction.user_profiles?.email || "Unknown",
      subscriptionTypeId: updatedTransaction.subscription_type_id,
      subscriptionTypeName: updatedTransaction.subscription_types?.name || "Unknown",
      amount: parseFloat(updatedTransaction.amount || 0),
      paymentMethod: updatedTransaction.payment_method || "",
      paymentStatus: updatedTransaction.payment_status || "pending",
      paidAt: updatedTransaction.paid_at,
      expiresAt: updatedTransaction.expires_at,
      metadata: updatedTransaction.metadata || {},
      createdAt: updatedTransaction.created_at,
      updatedAt: updatedTransaction.updated_at,
    };

    // Auto-create atau update user_subscription jika payment status berubah menjadi 'paid'
    if (newPaymentStatus === "paid" && oldPaymentStatus !== "paid") {
      // Check if subscription already exists for this transaction
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("transaction_id", id)
        .maybeSingle();

      if (!existingSubscription) {
        // Check if user already has an active subscription
        const { data: userActiveSubscription } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", oldTransaction.user_id)
          .eq("is_active", true)
          .maybeSingle();

        const durationDays = oldTransaction.subscription_types?.duration_days || 30;
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        if (userActiveSubscription) {
          // Update existing subscription instead of creating new
          const updatePayload = {
            subscription_type_id: oldTransaction.subscription_type_id,
            transaction_id: id,
            started_at: now.toISOString(),
            expires_at: expiresAt.toISOString(),
            is_active: true,
            updated_at: now.toISOString(),
          };

          const { data: subscriptionData, error: subscriptionError } = await supabase
            .from("user_subscriptions")
            .update(updatePayload)
            .eq("id", userActiveSubscription.id)
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
            user_id: oldTransaction.user_id,
            subscription_type_id: oldTransaction.subscription_type_id,
            transaction_id: id,
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
    }

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.UPDATE,
      resourceType: ResourceTypes.TRANSACTION,
      resourceId: id,
      description: `Mengupdate transaction: ${resp.amount} untuk ${resp.userName}`,
      metadata: {
        old_values: {
          paymentStatus: oldPaymentStatus,
          amount: parseFloat(oldTransaction.amount || 0),
        },
        new_values: {
          paymentStatus: resp.paymentStatus,
          amount: resp.amount,
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
 * DELETE /api/transactions/[id]
 * Delete transaction (requires admin auth)
 * Validasi: tidak bisa dihapus jika sudah digunakan oleh user_subscription
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

    // Check if transaction exists
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select(`
        id,
        amount,
        payment_status,
        user_profiles(id, name, email)
      `)
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!transaction) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    // Check if transaction is used by user_subscription
    const { data: userSubscription, error: subError } = await supabase
      .from("user_subscriptions")
      .select("id")
      .eq("transaction_id", id)
      .maybeSingle();

    if (subError) throw subError;

    if (userSubscription) {
      return NextResponse.json(
        { error: "Transaksi tidak dapat dihapus karena sudah digunakan oleh langganan pengguna" },
        { status: 400 }
      );
    }

    // Delete transaction
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // Log activity
    await logAdminActivity({
      userId: adminUser.userId,
      actionType: ActionTypes.DELETE,
      resourceType: ResourceTypes.TRANSACTION,
      resourceId: id,
      description: `Menghapus transaksi: Rp ${parseFloat(transaction.amount || 0).toLocaleString("id-ID")} untuk ${transaction.user_profiles?.name || transaction.user_profiles?.email || "Unknown"}`,
      metadata: {
        old_values: {
          amount: parseFloat(transaction.amount || 0),
          paymentStatus: transaction.payment_status,
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

