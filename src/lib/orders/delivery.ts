import type { Order } from "@/types";

type DeliveryFields = Pick<
  Order,
  | "recipient_first_name"
  | "recipient_last_name"
  | "delivery_city"
  | "delivery_district"
  | "delivery_address_text"
>;

/** "Aysel Məmmədova", or null for orders placed before names were asked. */
export function recipientName(order: Partial<DeliveryFields>): string | null {
  const name = [order.recipient_first_name, order.recipient_last_name]
    .filter(Boolean)
    .join(" ");
  return name || null;
}

/** "Bakı, Nəsimi r., Nizami küç. 12" — as the checkout review shows it. */
export function deliveryAddress(order: Partial<DeliveryFields>): string | null {
  const parts = [order.delivery_city, order.delivery_district, order.delivery_address_text]
    .map((part) => part?.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}
