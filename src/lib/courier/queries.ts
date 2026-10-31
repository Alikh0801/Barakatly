import { requireCourier } from "@/lib/courier/auth";
import { createClient } from "@/lib/supabase/server";
import { courierNextStatuses, isPickedUpBy } from "@/lib/orders/courier-steps";
import type { Order, OrderItem, OrderStatus, OrderStatusEvent } from "@/types";

export type CourierOrderItem = Pick<
  OrderItem,
  "id" | "product_title" | "quantity" | "unit_type" | "unit_size" | "status" | "farmer_id"
> & {
  farmers: { owner_name: string | null; location_text: string | null } | null;
};

export type CourierOrder = Omit<Order, "total_amount" | "subtotal" | "delivery_fee"> & {
  order_items: CourierOrderItem[];
  /** Oldest first. */
  order_status_events: OrderStatusEvent[];
  /** What this courier may mark next (see courierNextStatuses). */
  next_statuses: OrderStatus[];
  /** Picked up by this courier, whatever the customer is shown yet. */
  picked_up_by_me: boolean;
};

const COURIER_ORDER_SELECT = `
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
      ),
      order_status_events (id, order_id, order_item_id, status, changed_by, note, created_at)
    `;

function sortEvents<T extends { order_status_events: OrderStatusEvent[] | null }>(order: T): T {
  return {
    ...order,
    order_status_events: [...(order.order_status_events ?? [])].sort((a, b) =>
      a.created_at.localeCompare(b.created_at),
    ),
  };
}

export async function getCourierQueue(): Promise<CourierOrder[]> {
  const { courier } = await requireCourier();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(COURIER_ORDER_SELECT)
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
      ...sortEvents(order),
      next_statuses: courierNextStatuses(order, courier.id),
      picked_up_by_me: isPickedUpBy(order, courier.id),
    }));
}

/**
 * The orders this courier has closed: delivered, or could not be delivered.
 * Newest first, the last 100.
 */
export async function getCourierHistory(): Promise<CourierOrder[]> {
  const { courier } = await requireCourier();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(COURIER_ORDER_SELECT)
    .eq("courier_id", courier.id)
    .in("status", ["delivered", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[courier.getCourierHistory]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as Omit<CourierOrder, "next_statuses" | "picked_up_by_me">[]).map(
    (order) => ({ ...sortEvents(order), next_statuses: [], picked_up_by_me: true }),
  );
}
