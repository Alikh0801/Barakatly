import type { OrderItemStatus } from "@/types";

/**
 * Line statuses at which an admin may send an order to couriers by hand.
 * "Hazırlandı" is enough there: the admin is making a judgement call.
 */
export const COURIER_READY_ITEM_STATUSES: OrderItemStatus[] = ["ready", "awaiting_pickup"];

/** Whether every line that isn't cancelled is ready for a courier. */
export function isReadyForCourier(items: { status: OrderItemStatus }[]): boolean {
  return items.every(
    (item) => item.status === "cancelled" || COURIER_READY_ITEM_STATUSES.includes(item.status),
  );
}
