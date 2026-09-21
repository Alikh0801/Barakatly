"use server";

import { revalidatePath } from "next/cache";
import { requireCourier } from "@/lib/courier/auth";
import {
  COURIER_ORDER_STATUS_TRANSITIONS,
  getOrderStatusLabel,
} from "@/lib/orders/labels";
import { insertEventAndNotify, notifyUser } from "@/lib/notifications/helpers";
import { getOrderFarmerProfileIds } from "@/lib/orders/farmers";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType, OrderItemStatus, OrderStatus } from "@/types";

export type CourierActionState = {
  error?: string;
  success?: string;
};

function notificationForStatus(
  status: OrderStatus,
  failureReason?: string,
): {
  type: NotificationType;
  title: string;
  body: string;
} | null {
  if (status === "picked_up") {
    return {
      type: "order_picked_up",
      title: "Kuryer yola çıxdı",
      body: "Kuryer sifarişinizi götürdü və çatdırmağa yola düşdü.",
    };
  }
  if (status === "delivered") {
    return {
      type: "order_delivered",
      title: "Sifarişiniz çatdırıldı",
      body: "Sifarişiniz uğurla çatdırıldı. Barakatly-ni seçdiyiniz üçün təşəkkürlər!",
    };
  }
  if (status === "cancelled" && failureReason) {
    return {
      type: "general",
      title: "Sifariş çatdırılmadı",
      body: `Kuryer sifarişinizi çatdıra bilmədi. Səbəb: ${failureReason} Suallarınız varsa bizimlə əlaqə saxlayın.`,
    };
  }
  return null;
}

function farmerNotificationForStatus(
  status: OrderStatus,
  failureReason?: string,
): { title: string; body: string } | null {
  if (status === "picked_up") {
    return {
      title: "Sifariş kuryerə təhvil verildi",
      body: "Kuryer sifarişi götürdü və çatdırmağa yola düşdü.",
    };
  }
  if (status === "delivered") {
    return {
      title: "Sifariş çatdırıldı",
      body: "Kuryer sifarişi müştəriyə çatdırdı.",
    };
  }
  if (status === "cancelled" && failureReason) {
    return {
      title: "Sifariş çatdırılmadı",
      body: `Kuryer çatdıra bilmədi və sifariş ləğv edildi. Səbəb: ${failureReason}`,
    };
  }
  return null;
}

export async function advanceCourierOrder(
  _prev: CourierActionState,
  formData: FormData
): Promise<CourierActionState> {
  const { profile, courier } = await requireCourier();
  const orderId = String(formData.get("order_id") ?? "").trim();
  const nextStatus = String(formData.get("next_status") ?? "") as OrderStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderId || !nextStatus) {
    return { error: "Status seçin." };
  }

  if (nextStatus === "cancelled" && !reason) {
    return { error: "Çatdırıla bilmədiyi səbəbi qeyd edin." };
  }

  const supabase = await createClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, customer_id, status, order_code, courier_id")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { error: "Sifariş tapılmadı." };
  }

  if (order.courier_id && order.courier_id !== courier.id) {
    return { error: "Bu sifariş artıq başqa kuryer tərəfindən götürülüb." };
  }

  const allowed = COURIER_ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: "Bu status keçidinə icazə verilmir." };
  }

  // Claim the order on the courier's own row too — RLS only allows this
  // update to affect a row that's unclaimed or already claimed by this
  // courier, so a second courier racing for the same order gets 0 rows
  // back here instead of silently overwriting the first courier's claim.
  const { data: updatedOrders, error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus, courier_id: courier.id })
    .eq("id", orderId)
    .select("id");

  if (updateError) {
    console.error("[courier.advanceCourierOrder]", updateError.message);
    return { error: "Status yenilənmədi." };
  }

  if (!updatedOrders || updatedOrders.length === 0) {
    return { error: "Bu sifariş artıq başqa kuryer tərəfindən götürülüb." };
  }

  // A failed delivery is reported as an order cancellation — the
  // orders_cancel_cascade trigger (024/025) picks it up automatically,
  // cascading order_items to "cancelled" and restoring product stock, no
  // matter which code path set the status. Only picked_up/delivered need
  // the manual item-status bump here.
  if (nextStatus !== "cancelled") {
    const itemStatus: OrderItemStatus =
      nextStatus === "delivered" ? "delivered" : "picked_up";
    const priorItemStatuses: OrderItemStatus[] =
      nextStatus === "delivered" ? ["picked_up"] : ["ready", "awaiting_pickup"];

    await supabase
      .from("order_items")
      .update({ status: itemStatus })
      .eq("order_id", orderId)
      .in("status", priorItemStatuses);
  }

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: nextStatus,
    note:
      nextStatus === "cancelled"
        ? `Kuryer: çatdırıla bilmədi. Səbəb: ${reason}`
        : `Kuryer: ${getOrderStatusLabel(nextStatus)}`,
    changedBy: profile.id,
    notification: notificationForStatus(nextStatus, reason),
  });

  const farmerNotification = farmerNotificationForStatus(nextStatus, reason);
  if (farmerNotification) {
    const farmerProfileIds = await getOrderFarmerProfileIds(supabase, order.id);
    await Promise.all(
      farmerProfileIds.map((profileId) =>
        notifyUser({
          userId: profileId,
          type:
            nextStatus === "delivered"
              ? "order_delivered"
              : nextStatus === "cancelled"
                ? "general"
                : "order_picked_up",
          title: farmerNotification.title,
          body: `${order.order_code}: ${farmerNotification.body}`,
          metadata: { order_id: order.id },
        }),
      ),
    );
  }

  revalidatePath("/courier");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/notifications");
  revalidatePath("/farmer");
  revalidatePath("/farmer/orders");

  return { success: `${order.order_code} statusu yeniləndi.` };
}
