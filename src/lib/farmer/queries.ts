import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  Category,
  FarmerPost,
  FarmerPostMedia,
  Order,
  OrderItem,
  Product,
  Subcategory,
} from "@/types";

export type FarmerProduct = Product & {
  product_images: { id: string; url: string; sort_order: number }[];
  categories: Pick<Category, "name_az" | "slug"> | null;
};

export async function getFarmerProducts(farmerId: string): Promise<FarmerProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (id, url, sort_order),
      categories:category_id (name_az, slug)
    `
    )
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[farmer.getFarmerProducts]", error.message);
    return [];
  }

  return (data ?? []) as unknown as FarmerProduct[];
}

export async function getFarmerProductById(
  farmerId: string,
  productId: string
): Promise<FarmerProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `
      *,
      product_images (id, url, sort_order),
      categories:category_id (name_az, slug)
    `
    )
    .eq("farmer_id", farmerId)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    console.error("[farmer.getFarmerProductById]", error.message);
    return null;
  }

  return data as unknown as FarmerProduct | null;
}

export type FarmerOrderItem = OrderItem & {
  orders: (Pick<Order, "id" | "order_code" | "status" | "created_at"> & {
    customer: { full_name: string | null } | null;
  }) | null;
};

export type FarmerOrderHeader = Pick<
  Order,
  "id" | "order_code" | "status" | "created_at" | "customer_id"
> & {
  customer: { full_name: string | null } | null;
};

/**
 * Order headers for orders that contain this farmer's items, by order id.
 *
 * Farmers have no SELECT on `orders` — the row carries the customer's phone,
 * address and the whole basket's total — so a farmer-session join to it
 * returned nothing: the orders page was always empty, and status updates
 * never notified anyone. This reads with the service role instead, but only
 * orders that really include one of `farmerId`'s items, and only the columns
 * a farmer needs. `farmerId` must come from requireApprovedFarmer().
 */
export async function getFarmerOrderHeaders(
  farmerId: string,
  orderIds: string[],
): Promise<Map<string, FarmerOrderHeader>> {
  const headers = new Map<string, FarmerOrderHeader>();
  if (orderIds.length === 0) return headers;

  const { data, error } = await createAdminClient()
    .from("orders")
    .select(
      `
      id,
      order_code,
      status,
      created_at,
      customer_id,
      customer:profiles!orders_customer_id_fkey (full_name),
      order_items!inner (farmer_id)
    `
    )
    .in("id", orderIds)
    .eq("order_items.farmer_id", farmerId);

  if (error) {
    console.error("[farmer.getFarmerOrderHeaders]", error.message);
    return headers;
  }

  for (const row of data ?? []) {
    const customer = Array.isArray(row.customer) ? row.customer[0] : row.customer;
    headers.set(row.id, {
      id: row.id,
      order_code: row.order_code,
      status: row.status,
      created_at: row.created_at,
      customer_id: row.customer_id,
      customer: customer ? { full_name: customer.full_name } : null,
    });
  }
  return headers;
}

export async function getFarmerOrderItems(
  farmerId: string
): Promise<FarmerOrderItem[]> {
  // The farmer's own lines, under RLS as before…
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[farmer.getFarmerOrderItems]", error.message);
    return [];
  }

  // …then the headers of just those orders (see getFarmerOrderHeaders).
  const items = data ?? [];
  const headers = await getFarmerOrderHeaders(farmerId, [
    ...new Set(items.map((item) => item.order_id)),
  ]);

  return items
    .flatMap((item) => {
      const order = headers.get(item.order_id);
      // Hide orders whose payment the admin hasn't confirmed yet — farmers
      // should only see (and start preparing) orders that are actually paid.
      if (!order || order.status === "awaiting_confirmation") return [];
      return [
        {
          ...item,
          orders: {
            id: order.id,
            order_code: order.order_code,
            status: order.status,
            created_at: order.created_at,
            customer: order.customer,
          },
        },
      ];
    })
    .slice(0, 50);
}

export type FarmerBlogPost = FarmerPost & {
  farmer_post_media: FarmerPostMedia[];
};

export async function getFarmerBlogPosts(
  farmerId: string
): Promise<FarmerBlogPost[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("farmer_posts")
    .select(
      `
      *,
      farmer_post_media (
        id,
        post_id,
        media_type,
        url,
        sort_order,
        created_at
      )
    `
    )
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (error) {
    console.error("[farmer.getFarmerBlogPosts]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as FarmerBlogPost[]).map((post) => ({
    ...post,
    farmer_post_media: [...(post.farmer_post_media ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order
    ),
  }));
}

export async function getShopCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("approved", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[farmer.getShopCategories]", error.message);
    return [];
  }

  return data ?? [];
}

export async function getShopSubcategories(): Promise<Subcategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subcategories")
    .select("*")
    .eq("approved", true)
    .order("name_az", { ascending: true });

  if (error) {
    console.error("[farmer.getShopSubcategories]", error.message);
    return [];
  }

  return data ?? [];
}
