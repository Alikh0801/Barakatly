import { createClient } from "@/lib/supabase/server";
import type {
  Bank,
  Category,
  Courier,
  Farmer,
  Order,
  OrderItem,
  OrderStatusEvent,
  Payment,
  Product,
} from "@/types";

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

export type AdminOrderItem = Pick<
  OrderItem,
  | "id"
  | "product_title"
  | "quantity"
  | "unit_type"
  | "status"
  | "farmer_id"
  | "line_total"
> & {
  farmers: { farm_name: string } | null;
};

export type AdminOrderListItem = Order & {
  /** Unique FK → may be object or array depending on PostgREST embed shape. */
  payments:
    | Pick<Payment, "id" | "status">
    | Pick<Payment, "id" | "status">[]
    | null;
  customer: { full_name: string | null; email: string | null } | null;
  order_items: AdminOrderItem[] | null;
  order_status_events: OrderStatusEvent[] | null;
};

export async function getAdminOrders(): Promise<AdminOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      payments (id, status),
      customer:profiles!orders_customer_id_fkey (full_name, email),
      order_items (
        id,
        product_title,
        quantity,
        unit_type,
        status,
        farmer_id,
        line_total,
        farmers (farm_name)
      ),
      order_status_events (
        id,
        order_id,
        order_item_id,
        status,
        changed_by,
        note,
        created_at
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin.getAdminOrders]", error.message);
    return [];
  }

  const orders = (data ?? []) as unknown as AdminOrderListItem[];

  return orders.map((order) => ({
    ...order,
    order_status_events: [...(order.order_status_events ?? [])].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
  }));
}

export type AdminFarmer = Farmer & {
  profiles: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export async function getAdminFarmers(): Promise<AdminFarmer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmers")
    .select("*, profiles:profile_id (full_name, email, phone)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin.getAdminFarmers]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminFarmer[];
}

export type AdminProduct = Product & {
  farmers: Pick<Farmer, "farm_name"> | null;
  categories: { name_az: string } | null;
  product_images: { url: string; sort_order: number }[] | null;
};

export async function getAdminPendingProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      farmers (farm_name),
      categories:category_id (name_az),
      product_images (url, sort_order)
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin.getAdminPendingProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminProduct[];
}

export async function getAdminApprovedProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      farmers (farm_name),
      categories:category_id (name_az),
      product_images (url, sort_order)
    `
    )
    .eq("status", "approved")
    .order("updated_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[admin.getAdminApprovedProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminProduct[];
}

export type AdminCourier = Courier & {
  profiles: { full_name: string | null; email: string | null } | null;
};

export async function getAdminCouriers(): Promise<AdminCourier[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("couriers")
    .select("*, profiles:profile_id (full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin.getAdminCouriers]", error.message);
    return [];
  }

  return (data ?? []) as unknown as AdminCourier[];
}

export type AdminCategory = Category;

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[admin.getAdminCategories]", error.message);
    return [];
  }

  return data ?? [];
}

export type AdminBank = Bank;

export async function getAdminBanks(): Promise<AdminBank[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("banks")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin.getAdminBanks]", error.message);
    return [];
  }

  return data ?? [];
}

export type AdminNavBadges = {
  payments: number;
  orders: number;
  farmers: number;
  products: number;
};

async function countRows(
  table: "payments" | "orders" | "farmers" | "products",
  filters: { column: string; value: string }[],
): Promise<number> {
  const supabase = await createClient();
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const { count, error } = await query;
  if (error) {
    console.error(`[admin.count.${table}]`, error.message);
    return 0;
  }
  return count ?? 0;
}

/** Pending items needing admin action — shown on sidebar until resolved. */
export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  const [payments, orders, farmers, products] = await Promise.all([
    countRows("payments", [{ column: "status", value: "pending" }]),
    countRows("orders", [
      { column: "status", value: "awaiting_confirmation" },
    ]),
    countRows("farmers", [{ column: "status", value: "pending" }]),
    countRows("products", [{ column: "status", value: "pending" }]),
  ]);

  return { payments, orders, farmers, products };
}
