"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_STATUS_TRANSITIONS } from "@/lib/orders/labels";
import { getOrderStatusLabel } from "@/lib/checkout/labels";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType, OrderStatus } from "@/types";

type ActionResult = { error?: string; success?: string };

function notificationForOrderStatus(status: OrderStatus): {
  type: NotificationType;
  title: string;
  body: string;
} | null {
  switch (status) {
    case "confirmed":
      return {
        type: "order_confirmed",
        title: "Sifarişiniz təsdiqləndi",
        body: "Ödənişiniz təsdiqləndi və sifarişiniz emala göndərildi.",
      };
    case "farmer_accepted":
      return {
        type: "order_confirmed",
        title: "Fermer sifarişi qəbul etdi",
        body: "Fermer sifarişinizi qəbul etdi və hazırlığa başladı.",
      };
    case "preparing":
      return {
        type: "order_prepared",
        title: "Sifarişiniz hazırlanır",
        body: "Məhsullarınız hazırlanır. Tezliklə kuryerə təhvil veriləcək.",
      };
    case "picked_up":
      return {
        type: "order_picked_up",
        title: "Sifarişiniz yolda",
        body: "Kuryer sifarişinizi götürdü və çatdırmağa yola düşdü.",
      };
    case "delivered":
      return {
        type: "order_delivered",
        title: "Sifarişiniz çatdırıldı",
        body: "Sifarişiniz uğurla çatdırıldı. Barakatly-ni seçdiyiniz üçün təşəkkürlər!",
      };
    case "cancelled":
      return {
        type: "general",
        title: "Sifariş ləğv edildi",
        body: "Sifarişiniz ləğv edildi. Suallarınız varsa bizimlə əlaqə saxlayın.",
      };
    default:
      return null;
  }
}

async function insertEventAndNotify(params: {
  orderId: string;
  customerId: string;
  status: string;
  note: string;
  adminId: string;
  notification?: {
    type: NotificationType;
    title: string;
    body: string;
  } | null;
}) {
  const supabase = await createClient();

  await supabase.from("order_status_events").insert({
    order_id: params.orderId,
    status: params.status,
    changed_by: params.adminId,
    note: params.note,
  });

  if (params.notification) {
    await supabase.from("notifications").insert({
      user_id: params.customerId,
      title: params.notification.title,
      body: params.notification.body,
      type: params.notification.type,
      metadata: { order_id: params.orderId },
    });
  }
}

export async function confirmPayment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");

  if (!paymentId) return { error: "Ödəniş tapılmadı." };

  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id, status, orders(id, customer_id, status, order_code)")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return { error: "Ödəniş tapılmadı." };
  }

  if (payment.status !== "pending") {
    return { error: "Bu ödəniş artıq emal olunub." };
  }

  const order = Array.isArray(payment.orders)
    ? payment.orders[0]
    : payment.orders;

  if (!order) return { error: "Sifariş tapılmadı." };

  const { error: updatePaymentError } = await supabase
    .from("payments")
    .update({
      status: "confirmed",
      confirmed_by: admin.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updatePaymentError) {
    console.error("[admin.confirmPayment]", updatePaymentError.message);
    return { error: "Ödəniş təsdiqlənmədi." };
  }

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: "confirmed" })
    .eq("id", order.id);

  if (updateOrderError) {
    console.error("[admin.confirmPayment.order]", updateOrderError.message);
    return { error: "Sifariş statusu yenilənmədi." };
  }

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "payment_confirmed",
    note: "Admin ödənişi təsdiqlədi",
    adminId: admin.id,
    notification: {
      type: "payment_received",
      title: "Ödənişiniz təsdiqləndi",
      body: `${order.order_code} sifarişi üçün ödəniş uğurla təsdiqləndi.`,
    },
  });

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "confirmed",
    note: "Sifariş təsdiqləndi",
    adminId: admin.id,
    notification: notificationForOrderStatus("confirmed"),
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/notifications");

  return { success: "Ödəniş təsdiqləndi." };
}

export async function rejectPayment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");

  if (!paymentId) return { error: "Ödəniş tapılmadı." };

  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, order_id, status, orders(id, customer_id, order_code)")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return { error: "Ödəniş tapılmadı." };
  }

  if (payment.status !== "pending") {
    return { error: "Bu ödəniş artıq emal olunub." };
  }

  const order = Array.isArray(payment.orders)
    ? payment.orders[0]
    : payment.orders;

  if (!order) return { error: "Sifariş tapılmadı." };

  const { error: updatePaymentError } = await supabase
    .from("payments")
    .update({
      status: "rejected",
      confirmed_by: admin.id,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updatePaymentError) {
    return { error: "Ödəniş rədd edilmədi." };
  }

  const { error: updateOrderError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id);

  if (updateOrderError) {
    return { error: "Sifariş ləğv edilmədi." };
  }

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "payment_rejected",
    note: "Admin ödənişi rədd etdi",
    adminId: admin.id,
    notification: {
      type: "general",
      title: "Ödəniş rədd edildi",
      body: `${order.order_code} sifarişi üçün ödəniş rədd edildi. Zəhmət olmasa yenidən cəhd edin və ya dəstəklə əlaqə saxlayın.`,
    },
  });

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "cancelled",
    note: "Sifariş ödəniş rəddinə görə ləğv edildi",
    adminId: admin.id,
    notification: notificationForOrderStatus("cancelled"),
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/notifications");

  return { success: "Ödəniş rədd edildi." };
}

export async function advanceOrderStatus(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const orderId = String(formData.get("order_id") ?? "");
  const nextStatus = String(formData.get("next_status") ?? "") as OrderStatus;

  if (!orderId || !nextStatus) {
    return { error: "Status seçin." };
  }

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, order_code")
    .eq("id", orderId)
    .single();

  if (error || !order) return { error: "Sifariş tapılmadı." };

  const allowed = ADMIN_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: "Bu status keçidinə icazə verilmir." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("[admin.advanceOrderStatus]", updateError.message);
    return { error: "Status yenilənmədi." };
  }

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: nextStatus,
    note: `Status dəyişdi: ${getOrderStatusLabel(nextStatus)}`,
    adminId: admin.id,
    notification: notificationForOrderStatus(nextStatus),
  });

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/notifications");

  return { success: `${order.order_code} statusu yeniləndi.` };
}
