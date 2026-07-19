import type { OrderItemStatus } from "@/types";

const ITEM_STATUS_RANK: Record<OrderItemStatus, number> = {
  new: 0,
  accepted: 1,
  preparing: 2,
  ready: 3,
  picked_up: 4,
  delivered: 5,
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
      lowestLabel: null as string | null,
    };
  }

  const ranks = items.map((item) => ITEM_STATUS_RANK[item.status] ?? 0);
  const minRank = Math.min(...ranks);

  return {
    readyCount: items.filter((item) => ITEM_STATUS_RANK[item.status] >= 3)
      .length,
    total: items.length,
    allAccepted: ranks.every((rank) => rank >= 1),
    allPreparingOrBeyond: ranks.every((rank) => rank >= 2),
    allReady: ranks.every((rank) => rank >= 3),
    lowestLabel:
      minRank <= 0
        ? "yeni"
        : minRank === 1
          ? "qəbul edilib"
          : minRank === 2
            ? "hazırlanır"
            : minRank === 3
              ? "hazırdır"
              : null,
  };
}
