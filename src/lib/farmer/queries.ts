import { createClient } from "@/lib/supabase/server";
import type { Category, Order, OrderItem, Product } from "@/types";

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
  orders: Pick<
    Order,
    "id" | "order_code" | "status" | "contact_phone" | "delivery_address_text" | "created_at"
  > | null;
};

export async function getFarmerOrderItems(
  farmerId: string
): Promise<FarmerOrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      *,
      orders (
        id,
        order_code,
        status,
        contact_phone,
        delivery_address_text,
        created_at
      )
    `
    )
    .eq("farmer_id", farmerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[farmer.getFarmerOrderItems]", error.message);
    return [];
  }

  return (data ?? []) as unknown as FarmerOrderItem[];
}

export async function getShopCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[farmer.getShopCategories]", error.message);
    return [];
  }

  return data ?? [];
}
