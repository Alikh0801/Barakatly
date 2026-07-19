import type { OrderItemStatus } from "@/types";
import { getOrderItemStatusLabel } from "@/lib/orders/labels";

const ITEM_STATUS_RANK: Record<OrderItemStatus, number> = {
  new: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  awaiting_pickup: 4,
  picked_up: 5,
  delivered: 6,
};

type ProgressItem = { status: OrderItemStatus };

/** Summarize farmer line-item progress for admin order cards. */
export function summarizeFarmerItemProgress(items: ProgressItem[]) {
  if (items.length === 0) {
    return {
      readyCount: 0,
      total: 0,
      allAccepted: false,
      allPreparingOrBeyond: false,
      allReady: false,
      allAwaitingPickup: false,
      lowestLabel: null as string | null,
    };
  }

  const ranks = items.map((item) => ITEM_STATUS_RANK[item.status] ?? 0);
  const minRank = Math.min(...ranks);
  const lowestStatus = items.find(
    (item) => (ITEM_STATUS_RANK[item.status] ?? 0) === minRank
  )?.status;

  return {
    readyCount: items.filter((item) => ITEM_STATUS_RANK[item.status] >= 3)
      .length,
    total: items.length,
    allAccepted: ranks.every((rank) => rank >= 1),
    allPreparingOrBeyond: ranks.every((rank) => rank >= 2),
    allReady: ranks.every((rank) => rank >= 3),
    allAwaitingPickup: ranks.every((rank) => rank >= 4),
    lowestLabel: lowestStatus
      ? getOrderItemStatusLabel(lowestStatus)
      : null,
  };
}
