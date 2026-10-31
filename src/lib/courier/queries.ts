import { requireCourier } from "@/lib/courier/auth";
import { createClient } from "@/lib/supabase/server";
import { courierNextStatuses, isPickedUpBy } from "@/lib/orders/courier-steps";
import type { Order, OrderItem, OrderStatus } from "@/types";

export type CourierOrderItem = Pick<
  OrderItem,
  "id" | "product_title" | "quantity" | "unit_type" | "unit_size" | "status" | "farmer_id"
> & {
  farmers: { owner_name: string | null; location_text: string | null } | null;
};

export type CourierOrder = Omit<Order, "total_amount" | "subtotal" | "delivery_fee"> & {
  order_items: CourierOrderItem[];
  /** What this courier may mark next (see courierNextStatuses). */
  next_statuses: OrderStatus[];
  /** Picked up by this courier, whatever the customer is shown yet. */
  picked_up_by_me: boolean;
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
      recipient_first_name,
      recipient_last_name,
      delivery_city,
      delivery_district,
      order_note,
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
        unit_type,
        unit_size,
        status,
        farmer_id,
        farmers (owner_name, location_text)
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
  const orders = (data ?? []) as unknown as Omit<CourierOrder, "next_statuses" | "picked_up_by_me">[];
  return orders
    .filter((order) => !order.courier_id || order.courier_id === courier.id)
    .map((order) => ({
      ...order,
      next_statuses: courierNextStatuses(order, courier.id),
      picked_up_by_me: isPickedUpBy(order, courier.id),
    }));
}
