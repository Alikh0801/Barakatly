import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderItemStatus, OrderStatus } from "@/types";

/**
 * Line statuses at which an admin may send an order to couriers by hand.
 * "Hazırlandı" is enough there: the admin is making a judgement call.
 */
export const COURIER_READY_ITEM_STATUSES: OrderItemStatus[] = ["ready", "awaiting_pickup"];

/** Paid orders that have not reached couriers yet. */
const PRE_COURIER_ORDER_STATUSES: OrderStatus[] = ["confirmed", "farmer_accepted", "preparing"];

/**
 * Puts an order into the courier queue once every live line is
 * "awaiting_pickup" — every farmer has said the goods are ready to hand over.
 *
 * Before this, only an admin could move an order to "awaiting_courier"
 * (and only via "preparing"), so lines could all read "Kuryer tərəfindən
 * götürülməyi gözləyir" while the order itself stayed out of the courier
 * queue until someone noticed.
 *
 * Reads every line of the order, which no single farmer may see under RLS,
 * so it uses the service role. The status change is conditional, so when
 * two farmers finish at the same moment only one call moves the order and
 * gets `true` — the caller sends notifications only then.
 */
export async function moveOrderToCourierQueueIfHandedOver(orderId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from("order_items")
    .select("status")
    .eq("order_id", orderId);

  if (error) {
    console.error("[orders.moveOrderToCourierQueue] items", error.message);
    return false;
  }

  const live = (items ?? []).filter((item) => item.status !== "cancelled");
  if (live.length === 0 || live.some((item) => item.status !== "awaiting_pickup")) {
    return false;
  }

  const { data: moved, error: updateError } = await admin
    .from("orders")
    .update({ status: "awaiting_courier" })
    .eq("id", orderId)
    .in("status", PRE_COURIER_ORDER_STATUSES)
    .select("id");

  if (updateError) {
    console.error("[orders.moveOrderToCourierQueue] update", updateError.message);
    return false;
  }
  return (moved ?? []).length > 0;
}
