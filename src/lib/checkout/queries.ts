import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
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

export type OrderListItem = Order & {
  /** Unique FK → may be object or array depending on PostgREST embed shape. */
  payments: Pick<Payment, "status"> | Pick<Payment, "status">[] | null;
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
    .select("*, payments(status)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[checkout.getCustomerOrders]", error.message);
    return [];
  }

  return (data ?? []) as unknown as OrderListItem[];
}

export type OrderDetail = Order & {
  order_items: OrderItem[];
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
      order_items (*),
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
