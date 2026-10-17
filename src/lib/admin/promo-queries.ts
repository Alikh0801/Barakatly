import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type PromoCodeStatus = "active" | "inactive" | "expired" | "used_up";

export type AdminPromoCode = Database["public"]["Tables"]["promo_codes"]["Row"] & {
  /** Orders that used it, cancelled ones excluded (the same count the limit uses). */
  uses: number;
  status: PromoCodeStatus;
};

function statusOf(code: { is_active: boolean; expires_at: string | null; max_uses: number | null }, uses: number, now: number): PromoCodeStatus {
  if (!code.is_active) return "inactive";
  if (code.expires_at && new Date(code.expires_at).getTime() < now) return "expired";
  if (code.max_uses !== null && uses >= code.max_uses) return "used_up";
  return "active";
}

export async function getAdminPromoCodes(): Promise<AdminPromoCode[]> {
  const supabase = await createClient();
  const [{ data: codes, error }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("promo_code_id")
      .not("promo_code_id", "is", null)
      .neq("status", "cancelled"),
  ]);

  if (error) {
    console.error("[admin.getAdminPromoCodes]", error.message);
    return [];
  }
  if (ordersError) console.error("[admin.getAdminPromoCodes.orders]", ordersError.message);

  const uses = new Map<string, number>();
  for (const order of orders ?? []) {
    if (order.promo_code_id) uses.set(order.promo_code_id, (uses.get(order.promo_code_id) ?? 0) + 1);
  }

  const now = Date.now();
  return (codes ?? []).map((code) => {
    const used = uses.get(code.id) ?? 0;
    return {
      ...code,
      discount_value: Number(code.discount_value),
      min_order_amount: Number(code.min_order_amount),
      uses: used,
      status: statusOf(code, used, now),
    };
  });
}
