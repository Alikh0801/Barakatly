"use server";

import { revalidatePath } from "next/cache";
import { requireCourier } from "@/lib/courier/auth";
import {
  COURIER_ORDER_STATUS_TRANSITIONS,
  getOrderStatusLabel,
} from "@/lib/orders/labels";
import { insertEventAndNotify } from "@/lib/notifications/helpers";
import { createClient } from "@/lib/supabase/server";
import type { NotificationType, OrderItemStatus, OrderStatus } from "@/types";

export type CourierActionState = {
  error?: string;
  success?: string;
};

function notificationForStatus(status: OrderStatus): {
  type: NotificationType;
  title: string;
  body: string;
} | null {
  if (status === "picked_up") {
    return {
      type: "order_picked_up",
      title: "Sifarişiniz yolda",
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
  return null;
}

export async function advanceCourierOrder(
  _prev: CourierActionState,
  formData: FormData
): Promise<CourierActionState> {
  const { profile } = await requireCourier();
  const orderId = String(formData.get("order_id") ?? "").trim();
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

  if (error || !order) {
    return { error: "Sifariş tapılmadı." };
  }

  const allowed = COURIER_ORDER_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { error: "Bu status keçidinə icazə verilmir." };
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("[courier.advanceCourierOrder]", updateError.message);
    return { error: "Status yenilənmədi." };
  }

  const itemStatus: OrderItemStatus =
    nextStatus === "delivered" ? "delivered" : "picked_up";

  await supabase
    .from("order_items")
    .update({ status: itemStatus })
    .eq("order_id", orderId)
    .in("status", ["ready", "picked_up", "preparing", "accepted", "new"]);

  await insertEventAndNotify({
    orderId: order.id,
    customerId: order.customer_id,
    status: nextStatus,
    note: `Kuryer: ${getOrderStatusLabel(nextStatus)}`,
    changedBy: profile.id,
    notification: notificationForStatus(nextStatus),
  });

  revalidatePath("/courier");
  revalidatePath("/orders");
  revalidatePath(`/orders/${order.id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/notifications");

  return { success: `${order.order_code} statusu yeniləndi.` };
}
