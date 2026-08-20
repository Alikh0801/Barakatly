import { requireCourier } from "@/lib/courier/auth";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem } from "@/types";

export type CourierOrderItem = Pick<
  OrderItem,
  "id" | "product_title" | "quantity" | "status" | "farmer_id"
> & {
  farmers: { farm_name: string; location_text: string | null } | null;
};

export type CourierOrder = Omit<Order, "total_amount" | "subtotal" | "delivery_fee"> & {
  order_items: CourierOrderItem[];
};

export async function getCourierQueue(): Promise<CourierOrder[]> {
  const { courier } = await requireCourier();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_code,
      customer_id,
      contact_phone,
      delivery_address_text,
      delivery_lat,
      delivery_lng,
      status,
      courier_id,
      created_at,
      updated_at,
      order_items (
        id,
        product_title,
        quantity,
        status,
        farmer_id,
        farmers (farm_name, location_text)
      )
    `,
    )
    .in("status", ["awaiting_courier", "picked_up"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[courier.getCourierQueue]", error.message);
    return [];
  }

  // Unclaimed orders are visible to every courier; once claimed (picked_up),
  // only the courier holding it should see it in their own queue.
  const orders = (data ?? []) as unknown as CourierOrder[];
  return orders.filter(
    (order) => !order.courier_id || order.courier_id === courier.id,
  );
}
