import { createAdminClient } from "@/lib/supabase/admin";

/** Months shown on the revenue chart, the current one included. */
const FARMER_STATS_MONTHS = 6;

const PAGE_SIZE = 1000;
// Azerbaijan has kept UTC+4 all year since 2016.
const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;

type SalesRow = {
  id: string;
  created_at: string;
  order_items: { line_total: number | string | null; status: string; farmer_id: string }[] | null;
};

export type FarmerMonthRevenue = {
  /** "2026-10" */
  month: string;
  revenue: number;
  orders: number;
};

export type FarmerSalesStats = {
  months: FarmerMonthRevenue[];
  /** This month so far. */
  revenue: number;
  orders: number;
  /** Last month up to the same point, for a fair comparison early in a month. */
  previousRevenue: number;
  previousOrders: number;
};

/** Start of the given Baku calendar month, as a UTC instant. */
function bakuMonthStart(year: number, month: number) {
  return new Date(Date.UTC(year, month, 1) - BAKU_OFFSET_MS);
}

function monthKey(date: Date) {
  const baku = new Date(date.getTime() + BAKU_OFFSET_MS);
  return `${baku.getUTCFullYear()}-${String(baku.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Sales of one farmer's own items, by Baku month. An order counts once the
 * admin has confirmed its payment (the same point it appears in the farmer's
 * order list) and stops counting if it or the farmer's line is cancelled.
 *
 * Farmers have no SELECT on `orders`, so this reads with the service role,
 * limited to orders that contain `farmerId`'s items and to their own lines.
 * `farmerId` must come from requireFarmer()/requireApprovedFarmer().
 */
export async function getFarmerSalesStats(
  farmerId: string,
  now = new Date(),
): Promise<FarmerSalesStats> {
  const bakuNow = new Date(now.getTime() + BAKU_OFFSET_MS);
  const year = bakuNow.getUTCFullYear();
  const month = bakuNow.getUTCMonth();

  const thisMonthStart = bakuMonthStart(year, month);
  const lastMonthStart = bakuMonthStart(year, month - 1);
  const since = bakuMonthStart(year, month - (FARMER_STATS_MONTHS - 1));
  // Last month, cut at the same distance from its start as now is from this
  // month's start (and never past its own end).
  const previousCutoff = new Date(
    Math.min(
      lastMonthStart.getTime() + (now.getTime() - thisMonthStart.getTime()),
      thisMonthStart.getTime(),
    ),
  );

  const months = new Map<string, FarmerMonthRevenue>();
  for (let offset = FARMER_STATS_MONTHS - 1; offset >= 0; offset -= 1) {
    const key = monthKey(bakuMonthStart(year, month - offset));
    months.set(key, { month: key, revenue: 0, orders: 0 });
  }

  const stats: FarmerSalesStats = {
    months: [],
    revenue: 0,
    orders: 0,
    previousRevenue: 0,
    previousOrders: 0,
  };

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[farmer.getFarmerSalesStats]", (error as Error).message);
    stats.months = [...months.values()];
    return stats;
  }

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await admin
      .from("orders")
      .select("id, created_at, order_items!inner (line_total, status, farmer_id)")
      .eq("order_items.farmer_id", farmerId)
      .gte("created_at", since.toISOString())
      .not("status", "in", "(awaiting_confirmation,cancelled)")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("[farmer.getFarmerSalesStats]", error.message);
      break;
    }

    // The generated types don't list the orders -> order_items relation.
    const rows = (data ?? []) as unknown as SalesRow[];
    for (const order of rows) {
      const lines = (order.order_items ?? []).filter(
        (line) => line.status !== "cancelled",
      );
      if (lines.length === 0) continue;

      const revenue = lines.reduce((sum, line) => sum + Number(line.line_total ?? 0), 0);
      const createdAt = new Date(order.created_at);

      const bucket = months.get(monthKey(createdAt));
      if (bucket) {
        bucket.revenue += revenue;
        bucket.orders += 1;
      }
      if (createdAt >= thisMonthStart) {
        stats.revenue += revenue;
        stats.orders += 1;
      } else if (createdAt >= lastMonthStart && createdAt < previousCutoff) {
        stats.previousRevenue += revenue;
        stats.previousOrders += 1;
      }
    }

    if (rows.length < PAGE_SIZE) break;
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  stats.months = [...months.values()].map((entry) => ({
    ...entry,
    revenue: round(entry.revenue),
  }));
  stats.revenue = round(stats.revenue);
  stats.previousRevenue = round(stats.previousRevenue);
  return stats;
}

/** Start of the current Baku month, for "new this month" counts. */
export function currentBakuMonthStart(now = new Date()) {
  const bakuNow = new Date(now.getTime() + BAKU_OFFSET_MS);
  return bakuMonthStart(bakuNow.getUTCFullYear(), bakuNow.getUTCMonth());
}
