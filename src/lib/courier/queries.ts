import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types";

export type CourierOrder = Order & {
  order_items: Pick<
    OrderItem,
    "id" | "product_title" | "quantity" | "status" | "farmer_id"
  >[];
};

export async function getCourierQueue(): Promise<CourierOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        id,
        product_title,
        quantity,
        status,
        farmer_id
      )
    `
    )
    .in("status", ["preparing", "picked_up"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[courier.getCourierQueue]", error.message);
    return [];
  }

  return (data ?? []) as unknown as CourierOrder[];
}
