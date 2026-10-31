"use server";

import { revalidatePath } from "next/cache";
import { requireCourier } from "@/lib/courier/auth";
import { getOrderStatusLabel } from "@/lib/orders/labels";
import { courierNextStatuses } from "@/lib/orders/courier-steps";
import { insertEventAndNotify, notifyAdmins, notifyUser } from "@/lib/notifications/helpers";
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
    .select("id, customer_id, status, order_code, courier_id, order_items (id, product_title, status)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    return { error: "Sifariş tapılmadı." };
  }

  if (order.courier_id && order.courier_id !== courier.id) {
    return { error: "Bu sifariş artıq başqa kuryer tərəfindən götürülüb." };
  }

  const lines = (order.order_items ?? []) as unknown as { status: OrderItemStatus }[];
  if (!courierNextStatuses({ ...order, order_items: lines }, courier.id).includes(nextStatus)) {
    return { error: "Bu status keçidinə icazə verilmir." };
  }

  if (nextStatus === "picked_up") {
    // Picking up is the courier's mark on the lines; the customer sees
    // "Kuryer yola çıxdı" only once the admin sets it. The claim goes on
    // the order: RLS lets the update touch an unclaimed order or this
    // courier's own, so a second courier racing for it gets 0 rows.
    const { data: claimed, error: claimError } = await supabase
      .from("orders")
      .update({ courier_id: courier.id })
      .eq("id", orderId)
      .select("id");

    if (claimError) {
      console.error("[courier.advanceCourierOrder.claim]", claimError.message);
      return { error: "Status yenilənmədi." };
    }
    if (!claimed || claimed.length === 0) {
      return { error: "Bu sifariş artıq başqa kuryer tərəfindən götürülüb." };
    }

    const { data: pickedLines, error: linesError } = await supabase
      .from("order_items")
      .update({ status: "picked_up" })
      .eq("order_id", orderId)
      .in("status", ["ready", "awaiting_pickup"])
      .select("id, product_title");

    if (linesError) {
      console.error("[courier.advanceCourierOrder.lines]", linesError.message);
      return { error: "Status yenilənmədi." };
    }

    // One event per line, as farmers' marks are: line events stay off the
    // customer's status tracker.
    for (const line of pickedLines ?? []) {
      await insertEventAndNotify({
        orderId: order.id,
        customerId: order.customer_id,
        orderItemId: line.id,
        status: "picked_up",
        note: `Kuryer: ${line.product_title} götürüldü`,
        changedBy: profile.id,
        notification: null,
      });
    }

    // Shown in red on the admin's orders page, like a farmer's update.
    await notifyAdmins({
      type: "general",
      title: "Kuryer sifarişi götürdü",
      body: `${order.order_code} — kuryer məhsulları götürdü.`,
      metadata: {
        order_id: order.id,
        order_code: order.order_code,
        item_status: "picked_up",
      },
    });
  } else {
    // Delivered, or could not be: the customer sees it at once.
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

    // A failed delivery is an order cancellation: orders_cancel_cascade
    // cancels the lines and puts the stock back. Delivered lines follow here.
    if (nextStatus === "delivered") {
      await supabase
        .from("order_items")
        .update({ status: "delivered" })
        .eq("order_id", orderId)
        .eq("status", "picked_up");
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
  }

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
