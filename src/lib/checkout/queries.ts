import { createClient } from "@/lib/supabase/server";
import type { Bank, Order, OrderItem, Payment } from "@/types";

export async function getActiveBanks(): Promise<Bank[]> {
  const supabase = await createClient();
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

export type OrderListItem = Order & {
  payments: Pick<Payment, "status">[] | null;
};

export async function getCustomerOrders(): Promise<OrderListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    data: { user },
  } = await supabase.auth.getUser();

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
