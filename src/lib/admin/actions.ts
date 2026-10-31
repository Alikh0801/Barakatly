"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { ADMIN_STATUS_TRANSITIONS } from "@/lib/orders/labels";
import { getOrderStatusLabel } from "@/lib/checkout/labels";
import { adminCanSetStatus, statusOwner } from "@/lib/orders/admin-status";
import { getOrderFarmerProfileIds } from "@/lib/orders/farmers";
import { ITEM_CANCEL_ANNOUNCED } from "@/lib/orders/item-cancel";
import { notifyUser } from "@/lib/notifications/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
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
    case "awaiting_courier":
      return {
        type: "order_prepared",
        title: "Sifarişiniz kuryer gözləyir",
        body: "Məhsullar hazırdır. Kuryer tərəfindən götürülməyi gözləyir.",
      };
    case "picked_up":
      return {
        type: "order_picked_up",
        title: "Kuryer yola çıxdı",
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
  // Events and notifications are written only from the server (the API
  // can't insert them, migration 20261030120000); the caller is an admin
  // action that has already checked who is asking.
  const supabase = createAdminClient();

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


/** What the settle functions raise, as the admin should read it. */
function settleError(message: string, fallback: string): string {
  if (message.includes("ALREADY_SETTLED")) return "Bu ödəniş artıq emal olunub.";
  if (message.includes("ORDER_NOT_AWAITING")) return "Sifariş artıq ödəniş gözləmir.";
  if (message.includes("NOT_FOUND")) return "Ödəniş tapılmadı.";
  return fallback;
}

export async function confirmPayment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");

  if (!paymentId) return { error: "Ödəniş tapılmadı." };

  // The payment and the order are written together, in one transaction,
  // and only while the payment is still pending (migration 20261031090000).
  const supabase = await createClient();
  const { data: settled, error: settleErr } = await supabase
    .rpc("confirm_payment", { p_payment_id: paymentId })
    .single();

  if (settleErr || !settled) {
    console.error("[admin.confirmPayment]", settleErr?.message);
    return { error: settleError(settleErr?.message ?? "", "Ödəniş təsdiqlənmədi.") };
  }

  const order = { id: settled.order_id, customer_id: settled.customer_id, order_code: settled.order_code };

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

  // Order items only become visible on farmer dashboards once the order
  // leaves "awaiting_confirmation" (see getFarmerOrderItems) — let each
  // involved farmer know their part of it is now ready to prepare.
  const farmerProfileIds = await getOrderFarmerProfileIds(supabase, order.id);

  await Promise.all(
    farmerProfileIds.map((profileId) =>
      notifyUser({
        userId: profileId,
        type: "general",
        title: "Yeni sifariş hazırdır",
        body: `${order.order_code} sifarişi ödəniş təsdiqindən keçdi. Hazırlığa başlaya bilərsiniz.`,
        metadata: { order_id: order.id },
      }),
    ),
  );

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/notifications");
  revalidatePath("/farmer");
  revalidatePath("/farmer/orders");

  return { success: "Ödəniş təsdiqləndi." };
}

export async function rejectPayment(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const paymentId = String(formData.get("payment_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId) return { error: "Ödəniş tapılmadı." };
  if (!reason) return { error: "Rədd səbəbini qeyd edin." };

  // Payment rejected and order cancelled together, only while the payment
  // is still pending (migration 20261031090000).
  const supabase = await createClient();
  const { data: settled, error: settleErr } = await supabase
    .rpc("reject_payment", { p_payment_id: paymentId })
    .single();

  if (settleErr || !settled) {
    console.error("[admin.rejectPayment]", settleErr?.message);
    return { error: settleError(settleErr?.message ?? "", "Ödəniş rədd edilmədi.") };
  }

  const order = { id: settled.order_id, customer_id: settled.customer_id, order_code: settled.order_code };

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "payment_rejected",
    note: `Admin ödənişi rədd etdi. Səbəb: ${reason}`,
    adminId: admin.id,
    notification: {
      type: "general",
      title: "Ödəniş rədd edildi",
      body: `${order.order_code} sifarişi üçün ödəniş rədd edildi. Səbəb: ${reason}`,
    },
  });

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: "cancelled",
    note: `Sifariş ödəniş rəddinə görə ləğv edildi. Səbəb: ${reason}`,
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
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderId || !nextStatus) {
    return { error: "Status seçin." };
  }

  if (nextStatus === "cancelled" && !reason) {
    return { error: "Ləğv etmə səbəbini qeyd edin." };
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

  // The customer may only see a step its owner has marked on every line:
  // the farmers up to "kuryer gözləyir", the courier for "götürüldü" and
  // "çatdırıldı".
  const { data: items } = await supabase
    .from("order_items")
    .select("status")
    .eq("order_id", orderId);

  if (!adminCanSetStatus(nextStatus, items ?? [])) {
    return {
      error:
        statusOwner(nextStatus) === "kuryer"
          ? "Kuryer bu statusu hələ qeyd etməyib."
          : "Bütün fermerlər bu statusu hələ qeyd etməyib.",
    };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("[admin.advanceOrderStatus]", updateError.message);
    return { error: "Status yenilənmədi." };
  }

  const baseNotification = notificationForOrderStatus(nextStatus);
  const notification =
    nextStatus === "cancelled" && baseNotification
      ? { ...baseNotification, body: `${baseNotification.body} Səbəb: ${reason}` }
      : baseNotification;

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: nextStatus,
    note:
      nextStatus === "cancelled"
        ? `Sifariş ləğv edildi. Səbəb: ${reason}`
        : `Status dəyişdi: ${getOrderStatusLabel(nextStatus)}`,
    adminId: admin.id,
    notification,
  });

  // A cancellation past "awaiting_confirmation" means farmers already saw
  // this order (and may be actively preparing it) — tell them it's off.
  if (nextStatus === "cancelled") {
    const farmerProfileIds = await getOrderFarmerProfileIds(supabase, order.id);
    await Promise.all(
      farmerProfileIds.map((profileId) =>
        notifyUser({
          userId: profileId,
          type: "general",
          title: "Sifariş ləğv edildi",
          body: `${order.order_code} sifarişi admin tərəfindən ləğv edildi. Səbəb: ${reason}`,
          metadata: { order_id: order.id },
        }),
      ),
    );
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/notifications");
  revalidatePath("/farmer");
  revalidatePath("/farmer/orders");
  revalidatePath("/courier");

  return { success: `${order.order_code} statusu yeniləndi.` };
}

export async function deleteOrders(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const orderIds = formData
    .getAll("order_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);

  const uniqueIds = [...new Set(orderIds)];
  if (uniqueIds.length === 0) {
    return { error: "Silmək üçün sifariş seçin." };
  }

  try {
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from("orders")
      .delete()
      .in("id", uniqueIds);

    if (error) {
      console.error("[admin.deleteOrders]", error.message);
      // farmer_payouts keeps its orders (on delete restrict): what a farmer
      // is owed must not vanish with the order.
      if (error.code === "23503") {
        return { error: "Fermer ödənişi olan sifarişi silmək olmaz. Ləğv edə bilərsiniz." };
      }
      return { error: "Sifarişlər silinmədi." };
    }
  } catch (error) {
    console.error("[admin.deleteOrders]", error);
    return { error: "Sifarişlər silinmədi. Service role yoxlanılsın." };
  }

  revalidatePath("/admin", "layout");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
  revalidatePath("/orders");
  revalidatePath("/notifications");

  return {
    success:
      uniqueIds.length === 1
        ? "Sifariş silindi."
        : `${uniqueIds.length} sifariş silindi.`,
  };
}

/**
 * Passes a farmer's cancellation of one line on to the customer: until the
 * admin does, the customer still sees the line as ordered. Recorded as an
 * order event on that line.
 */
export async function announceItemCancellation(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const admin = await requireAdmin();
  const itemId = String(formData.get("order_item_id") ?? "").trim();
  if (!itemId) return { error: "Məhsul tapılmadı." };

  const supabase = await createClient();
  const { data: item } = await supabase
    .from("order_items")
    .select("id, order_id, product_title, line_total, status, cancel_reason, orders (order_code, customer_id)")
    .eq("id", itemId)
    .maybeSingle();

  const order = item?.orders as { order_code: string; customer_id: string } | null | undefined;
  if (!item || !order) return { error: "Məhsul tapılmadı." };
  if (item.status !== "cancelled") return { error: "Bu məhsul ləğv edilməyib." };

  const { count } = await supabase
    .from("order_status_events")
    .select("id", { count: "exact", head: true })
    .eq("order_item_id", itemId)
    .eq("status", ITEM_CANCEL_ANNOUNCED);
  if (count) return { success: "Müştəriyə artıq bildirilib." };

  const amount = `${Number(item.line_total).toFixed(2)} ₼`;
  const reason = item.cancel_reason ? ` Səbəb: ${item.cancel_reason}.` : "";

  const writer = createAdminClient();
  const { error } = await writer.from("order_status_events").insert({
    order_id: item.order_id,
    order_item_id: itemId,
    status: ITEM_CANCEL_ANNOUNCED,
    changed_by: admin.id,
    note: `${item.product_title}: ləğv müştəriyə bildirildi`,
  });
  if (error) {
    console.error("[admin.announceItemCancellation]", error.message);
    return { error: "Bildirilmədi. Yenidən cəhd edin." };
  }

  await writer.from("notifications").insert({
    user_id: order.customer_id,
    title: "Məhsul ləğv edildi",
    body: `${order.order_code} — "${item.product_title}" sifarişinizdən çıxarıldı.${reason} Bu məhsulun məbləği (${amount}) sizə qaytarılacaq.`,
    type: "general",
    metadata: { order_id: item.order_id },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${item.order_id}`);
  revalidatePath("/orders");
  revalidatePath("/notifications");
  return { success: "Müştəriyə bildirildi." };
}
