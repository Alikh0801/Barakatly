import type { OrderItem } from "@/types";
import { azNormalize } from "@/lib/shop/normalize";

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
  // Case and Azerbaijani letters aside, as on the shop's search.
  const needle = azNormalize(query);
  if (!needle) return true;

  if (azNormalize(order.id).includes(needle)) return true;
  if (azNormalize(order.order_code).includes(needle)) return true;

  const customerName = azNormalize(order.customer?.full_name ?? "");
  const customerEmail = azNormalize(order.customer?.email ?? "");
  if (customerName.includes(needle) || customerEmail.includes(needle)) {
    return true;
  }

  return (order.order_items ?? []).some((item) =>
    azNormalize(item.product_title).includes(needle)
  );
}
