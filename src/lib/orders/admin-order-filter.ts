import type { OrderItem } from "@/types";

/** Minimal shape needed for live admin order search. */
export type AdminOrderSearchItem = {
  id: string;
  order_code: string;
  customer: { full_name: string | null; email: string | null } | null;
  order_items: Pick<OrderItem, "product_title">[] | null;
};

export function matchesAdminOrderQuery(
  order: AdminOrderSearchItem,
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  if (order.id.toLowerCase().includes(needle)) return true;
  if (order.order_code.toLowerCase().includes(needle)) return true;

  const customerName = order.customer?.full_name?.toLowerCase() ?? "";
  const customerEmail = order.customer?.email?.toLowerCase() ?? "";
  if (customerName.includes(needle) || customerEmail.includes(needle)) {
    return true;
  }

  return (order.order_items ?? []).some((item) =>
    item.product_title.toLowerCase().includes(needle)
  );
}
