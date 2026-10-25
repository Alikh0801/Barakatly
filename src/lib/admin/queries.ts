import { getSessionUser } from "@/lib/auth/session";
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
  Subcategory,
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
    | "promo_code"
    | "discount_amount"
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
        promo_code,
        discount_amount,
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
  | "unit_size"
  | "status"
  | "farmer_id"
  | "line_total"
  | "cancel_reason"
> & {
  farmers: { owner_name: string | null } | null;
};

export type AdminOrderListItem = Order & {
  /** Unique FK → may be object or array depending on PostgREST embed shape. */
  payments:
    | Pick<Payment, "id" | "status" | "receipt_url">
    | Pick<Payment, "id" | "status" | "receipt_url">[]
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
      payments (id, status, receipt_url),
      customer:profiles!orders_customer_id_fkey (full_name, email),
      order_items (
        id,
        product_title,
        quantity,
        unit_type,
        unit_size,
        status,
        farmer_id,
        line_total,
        cancel_reason,
        farmers (owner_name)
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
  farmers: { owner_name: string | null } | null;
  categories: { name_az: string; approved: boolean } | null;
  subcategories: { name_az: string; approved: boolean } | null;
  product_images: { url: string; sort_order: number }[] | null;
};

export async function getAdminPendingProducts(): Promise<AdminProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      farmers (owner_name),
      categories:category_id (name_az, approved),
      subcategories:subcategory_id (name_az, approved),
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
      farmers (owner_name),
      categories:category_id (name_az, approved),
      subcategories:subcategory_id (name_az, approved),
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

export type AdminCategory = Category & {
  subcategories: Subcategory[];
  /** 1..N among approved categories; null while awaiting approval. */
  position: number | null;
  /**
   * Products already on sale in a category still awaiting approval: left
   * over from before approving a product required an approved category.
   */
  liveProductCount: number;
};

/**
 * Proposals awaiting approval first, then approved categories from the
 * highest number down, so the newest sits on top. Positions are counted
 * here rather than read raw, so older data with gaps still shows 1..N.
 */
export async function getAdminCategories(): Promise<AdminCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[admin.getAdminCategories]", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as (Category & { subcategories: Subcategory[] | null })[];
  const pendingIds = rows.filter((category) => !category.approved).map((category) => category.id);
  const liveCounts = new Map<string, number>();
  if (pendingIds.length > 0) {
    const { data: live, error: liveError } = await supabase
      .from("products")
      .select("category_id")
      .eq("status", "approved")
      .in("category_id", pendingIds);
    if (liveError) console.error("[admin.getAdminCategories.live]", liveError.message);
    for (const product of live ?? []) {
      if (product.category_id) {
        liveCounts.set(product.category_id, (liveCounts.get(product.category_id) ?? 0) + 1);
      }
    }
  }

  const withSubs = (category: (typeof rows)[number], position: number | null): AdminCategory => ({
    ...category,
    position,
    liveProductCount: liveCounts.get(category.id) ?? 0,
    subcategories: [...(category.subcategories ?? [])].sort((a, b) =>
      a.name_az.localeCompare(b.name_az),
    ),
  });

  const pending = rows
    .filter((category) => !category.approved)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((category) => withSubs(category, null));
  const approved = rows
    .filter((category) => category.approved)
    .map((category, index) => withSubs(category, index + 1))
    .reverse();

  return [...pending, ...approved];
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
  categories: number;
  reviews: number;
};

async function countRows(
  table:
    | "payments"
    | "orders"
    | "farmers"
    | "products"
    | "categories"
    | "subcategories"
    | "site_reviews",
  filters: { column: string; value: string | boolean }[],
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

/** Farmers awaiting either initial approval or a profile-edit review. */
async function countFarmersNeedingReview(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("farmers")
    .select("id", { count: "exact", head: true })
    .or("status.eq.pending,pending_submitted_at.not.is.null");

  if (error) {
    console.error("[admin.count.farmers]", error.message);
    return 0;
  }
  return count ?? 0;
}

export type FarmerOrderUpdate = {
  orderId: string;
  /** "BRK-… — Dağ balı: Hazırlanır. …", newest first per order. */
  messages: string[];
};

/**
 * Farmer status changes and cancellations this admin hasn't seen yet. They
 * are the admin notifications that carry an `item_status`; opening the
 * orders page marks them read.
 */
export async function getUnseenFarmerOrderUpdates(): Promise<FarmerOrderUpdate[]> {
  const user = await getSessionUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("body, metadata, created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .not("metadata->>item_status", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    console.error("[admin.getUnseenFarmerOrderUpdates]", error.message);
    return [];
  }

  const byOrder = new Map<string, string[]>();
  for (const row of data ?? []) {
    const metadata = row.metadata as Record<string, unknown> | null;
    const orderId = typeof metadata?.order_id === "string" ? metadata.order_id : null;
    if (!orderId) continue;
    byOrder.set(orderId, [...(byOrder.get(orderId) ?? []), row.body]);
  }
  return [...byOrder].map(([orderId, messages]) => ({ orderId, messages }));
}

async function countUnseenFarmerOrderUpdates(): Promise<number> {
  const user = await getSessionUser();
  if (!user) return 0;

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null)
    .not("metadata->>item_status", "is", null);

  if (error) {
    console.error("[admin.count.farmerUpdates]", error.message);
    return 0;
  }
  return count ?? 0;
}

/** Pending items needing admin action — shown on sidebar until resolved. */
export async function getAdminNavBadges(): Promise<AdminNavBadges> {
  const [
    payments,
    orders,
    farmers,
    products,
    unapprovedCategories,
    unapprovedSubcategories,
    reviews,
    farmerUpdates,
  ] = await Promise.all([
      countRows("payments", [{ column: "status", value: "pending" }]),
      countRows("orders", [
        { column: "status", value: "awaiting_confirmation" },
      ]),
      countFarmersNeedingReview(),
      countRows("products", [{ column: "status", value: "pending" }]),
      countRows("categories", [{ column: "approved", value: false }]),
      countRows("subcategories", [{ column: "approved", value: false }]),
      countRows("site_reviews", [{ column: "status", value: "pending" }]),
      countUnseenFarmerOrderUpdates(),
    ]);

  return {
    payments,
    // Unpaid orders plus farmer status changes the admin hasn't seen.
    orders: orders + farmerUpdates,
    farmers,
    products,
    categories: unapprovedCategories + unapprovedSubcategories,
    reviews,
  };
}
