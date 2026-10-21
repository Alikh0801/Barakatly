import { createClient } from "@/lib/supabase/server";
import type { ProductListItem } from "@/types/shop";

const wishlistSelect = `
  created_at,
  product:products (
    id,
    title,
    description,
    unit_type,
    unit_size,
    min_order_quantity,
    final_price,
    farmer_price,
    quantity_available,
    in_stock,
    sold_count,
    rating_average,
    rating_count,
    status,
    farmer:farmers ( id, farm_name, location_text, status ),
    category:categories ( slug, name_az ),
    product_images ( url, sort_order )
  )
`;

/**
 * The customer's favourites, newest first. Products that are no longer on
 * sale (archived, rejected) drop out: RLS hides them from the join.
 */
export async function getWishlistProducts(customerId: string): Promise<ProductListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select(wishlistSelect)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[wishlist.getWishlistProducts]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as { product: (ProductListItem & { status: string }) | null }[])
    .map((row) => row.product)
    .filter((product): product is ProductListItem & { status: string } =>
      Boolean(product && product.status === "approved"),
    );
}
