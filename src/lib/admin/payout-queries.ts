import { createClient } from "@/lib/supabase/server";
import type { FarmerPayoutStatus, UnitType } from "@/types";

export type PayoutItem = {
  product_title: string;
  quantity: number;
  unit_type: UnitType;
  unit_size: string | null;
  farmer_unit_price: number;
  line_total: number;
};

export type AdminPayout = {
  id: string;
  order_id: string;
  farmer_id: string;
  amount: number;
  bank_name: string | null;
  pan_number: string | null;
  status: FarmerPayoutStatus;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  order_code: string;
  farmer_name: string | null;
  items: PayoutItem[];
};

export type PayoutFilter = "pending" | "paid" | "all";

type PayoutRow = Omit<AdminPayout, "order_code" | "farmer_name" | "items"> & {
  orders: { order_code: string } | null;
  farmers: { owner_name: string | null } | null;
  farmer_payout_items: PayoutItem[] | null;
};

/** Payouts for the admin, newest first, by status and optionally one farmer. */
export async function getAdminPayouts(
  filter: PayoutFilter,
  farmerId: string | null,
): Promise<AdminPayout[]> {
  const supabase = await createClient();
  let query = supabase
    .from("farmer_payouts")
    .select(
      `
      *,
      orders (order_code),
      farmers (owner_name),
      farmer_payout_items (product_title, quantity, unit_type, unit_size, farmer_unit_price, line_total)
    `,
    )
    .order("created_at", { ascending: false });
  if (filter !== "all") query = query.eq("status", filter);
  if (farmerId) query = query.eq("farmer_id", farmerId);

  const { data, error } = await query;
  if (error) {
    console.error("[admin.getAdminPayouts]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as PayoutRow[]).map(
    ({ orders, farmers, farmer_payout_items, ...payout }) => ({
      ...payout,
      amount: Number(payout.amount),
      order_code: orders?.order_code ?? "—",
      farmer_name: farmers?.owner_name ?? null,
      items: (farmer_payout_items ?? []).map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        farmer_unit_price: Number(item.farmer_unit_price),
        line_total: Number(item.line_total),
      })),
    }),
  );
}

export type PayoutDebt = { farmer_id: string; farmer_name: string | null; amount: number; count: number };

/** What we still owe each farmer (pending payouts only), largest first. */
export async function getPayoutDebts(): Promise<PayoutDebt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmer_payouts")
    .select("farmer_id, amount, farmers (owner_name)")
    .eq("status", "pending");

  if (error) {
    console.error("[admin.getPayoutDebts]", error.message);
    return [];
  }

  const debts = new Map<string, PayoutDebt>();
  for (const row of (data ?? []) as unknown as {
    farmer_id: string;
    amount: number;
    farmers: { owner_name: string | null } | null;
  }[]) {
    const debt = debts.get(row.farmer_id) ?? {
      farmer_id: row.farmer_id,
      farmer_name: row.farmers?.owner_name ?? null,
      amount: 0,
      count: 0,
    };
    // Kept in qəpik while adding up, so the sums don't drift.
    debt.amount = (Math.round(debt.amount * 100) + Math.round(Number(row.amount) * 100)) / 100;
    debt.count += 1;
    debts.set(row.farmer_id, debt);
  }
  return [...debts.values()].sort((a, b) => b.amount - a.amount);
}

/** Every farmer who has a payout, for the farmer filter. */
export async function getPayoutFarmers(): Promise<{ id: string; name: string | null }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmer_payouts")
    .select("farmer_id, farmers (owner_name)");

  if (error) {
    console.error("[admin.getPayoutFarmers]", error.message);
    return [];
  }

  const farmers = new Map<string, string | null>();
  for (const row of (data ?? []) as unknown as {
    farmer_id: string;
    farmers: { owner_name: string | null } | null;
  }[]) {
    farmers.set(row.farmer_id, row.farmers?.owner_name ?? null);
  }
  return [...farmers.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "az"));
}
