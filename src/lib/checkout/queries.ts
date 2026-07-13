import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import type { Bank, Order, OrderItem, Payment } from "@/types";

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
  { revalidate: 300 }
);

export type OrderListItem = Order & {
  payments: Pick<Payment, "status">[] | null;
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
  payments: (Payment & { banks: Pick<Bank, "name" | "pan_number"> | null })[] | null;
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
      )
    `
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single();

  if (error) {
    console.error("[checkout.getOrderById]", error.message);
    return null;
  }

  return data as unknown as OrderDetail;
}
