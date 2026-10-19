import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { SavedAddress } from "@/lib/checkout/constants";
import type { Bank, Order, OrderItem, OrderStatusEvent, Payment } from "@/types";

async function fetchActiveBanks(): Promise<Bank[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("[checkout.getActiveBanks]", error.message);
    return [];
  }

  return data ?? [];
}

export const getActiveBanks = unstable_cache(
  fetchActiveBanks,
  ["active-banks"],
  { revalidate: 300, tags: ["banks"] }
);

/**
 * The addresses of the customer's latest orders, newest first and without
 * repeats, to fill the checkout form with one tap. Orders from before the
 * form asked for a city are skipped.
 */
export async function getSavedAddresses(customerId: string, limit = 3): Promise<SavedAddress[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "recipient_first_name, recipient_last_name, contact_phone, delivery_city, delivery_district, delivery_address_text",
    )
    .eq("customer_id", customerId)
    .not("delivery_city", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[checkout.getSavedAddresses]", error.message);
    return [];
  }

  const seen = new Set<string>();
  const addresses: SavedAddress[] = [];
  for (const row of data ?? []) {
    const address: SavedAddress = {
      firstName: row.recipient_first_name ?? "",
      lastName: row.recipient_last_name ?? "",
      phone: row.contact_phone ?? "",
      city: row.delivery_city ?? "",
      district: row.delivery_district ?? "",
      address: row.delivery_address_text ?? "",
    };
    const key = [address.city, address.district, address.address].join("|").toLowerCase();
    if (!address.address || seen.has(key)) continue;
    seen.add(key);
    addresses.push(address);
    if (addresses.length >= limit) break;
  }
  return addresses;
}

export type OrderItemProductImage = {
  url: string;
  sort_order: number;
};

export type OrderItemWithProduct = OrderItem & {
  products: {
    product_images: OrderItemProductImage[] | null;
  } | null;
};

export type OrderListItem = Order & {
  /** Unique FK → may be object or array depending on PostgREST embed shape. */
  payments: Pick<Payment, "status"> | Pick<Payment, "status">[] | null;
  order_items: OrderItemWithProduct[] | null;
};

export async function getCustomerOrders(): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      payments (status),
      order_items (
        id,
        product_title,
        quantity,
        unit_type,
        unit_price,
        line_total,
        status,
        product_id,
        products:product_id (
          product_images (url, sort_order)
        )
      )
    `
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[checkout.getCustomerOrders]", error.message);
    return [];
  }

  return (data ?? []) as unknown as OrderListItem[];
}

export type OrderDetail = Order & {
  order_items: OrderItemWithProduct[];
  /** Unique FK → may be object or array depending on PostgREST embed shape. */
  payments:
    | (Payment & { banks: Pick<Bank, "name" | "pan_number"> | null })
    | (Payment & { banks: Pick<Bank, "name" | "pan_number"> | null })[]
    | null;
  order_status_events: OrderStatusEvent[] | null;
};

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products:product_id (
          product_images (url, sort_order)
        )
      ),
      payments (
        *,
        banks (name, pan_number)
      ),
      order_status_events (*)
    `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (error) {
    console.error("[checkout.getOrderById]", error.message);
    return null;
  }

  const detail = data as unknown as OrderDetail;
  if (detail.order_status_events) {
    detail.order_status_events = [...detail.order_status_events].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }

  return detail;
}
