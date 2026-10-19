import type { OrderItemStatus } from "@/types";

/** A farmer may cancel their line until it is handed to the courier. */
export const FARMER_CANCELLABLE_ITEM_STATUSES: OrderItemStatus[] = [
  "new",
  "accepted",
  "preparing",
  "ready",
];

export const CANCEL_REASON_MIN = 5;
export const CANCEL_REASON_MAX = 500;
