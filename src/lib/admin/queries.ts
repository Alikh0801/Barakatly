import { createClient } from "@/lib/supabase/server";
import type { Bank, Order, Payment } from "@/types";

export type AdminPendingPayment = Payment & {
  banks: Pick<Bank, "name" | "pan_number"> | null;
  orders: Pick<
    Order,
    | "id"
    | "order_code"
    | "customer_id"
    | "status"
    | "total_amount"
    | "contact_phone"
    | "created_at"
  > | null;
};

export async function getPendingPayments(): Promise<AdminPendingPayment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      banks (name, pan_number),
      orders (
        id,
        order_code,
        customer_id,
        status,
        total_amount,
        contact_phone,
        created_at
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin.getPendingPayments]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminPendingPayment[];
}

export type AdminOrderListItem = Order & {
  payments: Pick<Payment, "id" | "status">[] | null;
  customer: { full_name: string | null; email: string | null } | null;
};

export async function getAdminOrders(): Promise<AdminOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      payments (id, status),
      customer:profiles!orders_customer_id_fkey (full_name, email)
    `
    )
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[admin.getAdminOrders]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminOrderListItem[];
}
