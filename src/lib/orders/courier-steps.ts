import type { OrderItemStatus, OrderStatus } from "@/types";

type CourierView = {
  status: OrderStatus;
  courier_id: string | null;
  order_items: { status: OrderItemStatus }[];
};

/**
 * Whether this courier has picked the order up: claimed it, and every line
 * still on it is picked up (or delivered). The customer doesn't see this
 * until the admin moves the order to "Kuryer yola çıxdı".
 */
export function isPickedUpBy(order: CourierView, courierId: string): boolean {
  const live = order.order_items.filter((item) => item.status !== "cancelled");
  return (
    order.courier_id === courierId &&
    live.length > 0 &&
    live.every((item) => item.status === "picked_up" || item.status === "delivered")
  );
}

/**
 * What the courier may mark next. Picking up only touches the lines (the
 * admin then shows it to the customer); delivering, or failing to, closes
 * the order for the customer straight away, whether or not the admin has
 * moved it to "Kuryer yola çıxdı" yet.
 */
export function courierNextStatuses(order: CourierView, courierId: string): OrderStatus[] {
  if (order.status === "picked_up" || (order.status === "awaiting_courier" && isPickedUpBy(order, courierId))) {
    return ["delivered", "cancelled"];
  }
  if (order.status === "awaiting_courier" && (!order.courier_id || order.courier_id === courierId)) {
    return ["picked_up"];
  }
  return [];
}
