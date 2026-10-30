import { ORDER_STATUS_FLOW } from "@/lib/orders/labels";
import type { OrderItemStatus, OrderStatus } from "@/types";

/**
 * The admin sets the status the customer sees, but only up to what the
 * owners of each stage have marked on the lines: farmers up to "kuryer
 * gözləyir", the courier for "götürüldü" and "çatdırıldı". A step nobody
 * has marked yet can't be set from the admin panel. Cancelling is always
 * allowed.
 */

/** How far along a line is. */
const ITEM_RANK: Record<OrderItemStatus, number> = {
  new: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  awaiting_pickup: 4,
  picked_up: 5,
  delivered: 6,
  cancelled: -1,
};

/**
 * The customer status each line rank allows. "Hazırlandı" still reads as
 * "Hazırlanır" for the customer: the order goes to couriers only once the
 * farmer says it's waiting for them.
 */
const STATUS_FOR_RANK: OrderStatus[] = [
  "confirmed",
  "farmer_accepted",
  "preparing",
  "preparing",
  "awaiting_courier",
  "picked_up",
  "delivered",
];

/**
 * The furthest customer status the lines still on the order allow: as far
 * as the slowest line. Null when every line is cancelled.
 */
export function statusFromLines(items: { status: OrderItemStatus }[]): OrderStatus | null {
  const ranks = items.filter((item) => item.status !== "cancelled").map((item) => ITEM_RANK[item.status]);
  return ranks.length > 0 ? STATUS_FOR_RANK[Math.min(...ranks)] : null;
}

/** Whether the lines allow the admin to show `target` to the customer. */
export function adminCanSetStatus(target: OrderStatus, items: { status: OrderItemStatus }[]): boolean {
  if (target === "cancelled") return true;
  const reached = statusFromLines(items);
  return reached !== null && ORDER_STATUS_FLOW.indexOf(target) <= ORDER_STATUS_FLOW.indexOf(reached);
}

/** Who still has to mark `target` on their lines before the admin can set it. */
export function statusOwner(target: OrderStatus): "fermerlər" | "kuryer" {
  return target === "picked_up" || target === "delivered" ? "kuryer" : "fermerlər";
}
