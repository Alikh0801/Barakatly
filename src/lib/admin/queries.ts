import { createClient } from "@/lib/supabase/server";
import type {
  Bank,
  Category,
  Courier,
  Farmer,
  Order,
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
