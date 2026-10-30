import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Whether every live line of the order is "awaiting_pickup" — every farmer
 * has said the goods are ready to hand over. The admin is told then and
 * sends the order to couriers; customers only ever see statuses the admin
 * sets.
 *
 * Reads every line of the order, which no single farmer may see under RLS,
 * so it uses the service role.
 */
export async function isOrderHandedOver(orderId: string): Promise<boolean> {
  const admin = createAdminClient();

  const { data: items, error } = await admin
    .from("order_items")
    .select("status")
    .eq("order_id", orderId);

  if (error) {
    console.error("[orders.isOrderHandedOver]", error.message);
    return false;
  }

  const live = (items ?? []).filter((item) => item.status !== "cancelled");
  return live.length > 0 && live.every((item) => item.status === "awaiting_pickup");
}
