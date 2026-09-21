import type { createClient } from "@/lib/supabase/server";

/** Distinct profile_ids of every farmer with at least one item on this order. */
export async function getOrderFarmerProfileIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
): Promise<string[]> {
  const { data: orderItems } = await supabase
    .from("order_items")
    .select("farmers(profile_id)")
    .eq("order_id", orderId);

  const profileIds = new Set(
    (orderItems ?? [])
      .map((item) => {
        const farmer = Array.isArray(item.farmers)
          ? item.farmers[0]
          : item.farmers;
        return farmer?.profile_id ?? null;
      })
      .filter((id): id is string => Boolean(id)),
  );

  return [...profileIds];
}
