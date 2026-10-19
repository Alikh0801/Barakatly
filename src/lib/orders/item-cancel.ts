import type { OrderItemStatus } from "@/types";

/** A farmer may cancel their line until it is handed to the courier. */
export const FARMER_CANCELLABLE_ITEM_STATUSES: OrderItemStatus[] = [
  "new",
  "accepted",
  "preparing",
  "ready",
];

/**
 * Order event recorded when the admin passes a farmer's cancellation on to
 * the customer. Until then the customer still sees the line as ordered.
 */
export const ITEM_CANCEL_ANNOUNCED = "item_cancel_announced";

export const CANCEL_REASON_MIN = 5;
export const CANCEL_REASON_MAX = 500;
