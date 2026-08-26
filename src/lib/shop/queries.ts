import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { CategoryItem, ProductDetail, ProductListItem } from "@/types/shop";

const productSelect = `
  id,
  title,
  description,
  unit_type,
  final_price,
  farmer_price,
  quantity_available,
  in_stock,
  sold_count,
  farmer:farmers (
    id,
    farm_name,
    location_text,
    status
  ),
  category:categories (
    slug,
    name_az
  ),
  product_images (
    url,
    sort_order
  )
`;

const productDetailSelect = `
  id,
  title,
  description,
  unit_type,
  final_price,
  farmer_price,
  quantity_available,
  in_stock,
  sold_count,
  farmer:farmers (
    id,
    farm_name,
    description,
    location_text,
    verified_at,
    avatar_url,
    status
  ),
  category:categories (
    slug,
    name_az
  ),
  product_images (
    url,
    sort_order
  )
`;

async function fetchCategories(): Promise<CategoryItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_az, icon, image_url")
    .eq("approved", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[shop.getCategories]", error.message);
    return [];
  }

  return data ?? [];
}

async function fetchProducts(categorySlug?: string): Promise<ProductListItem[]> {
  const supabase = createPublicClient();

  let categoryId: string | null = null;
  if (categorySlug) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (!category) return [];
    categoryId = category.id;
  }

  let query = supabase
    .from("products")
    .select(productSelect)
    .eq("status", "approved")
    .eq("in_stock", true)
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[shop.getProducts]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductListItem[]).filter(
    (product) => product.farmer?.status === "approved",
  );
}

async function fetchProductById(id: string): Promise<ProductDetail | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(productDetailSelect)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (error) {
    console.error("[shop.getProductById]", error.message);
    return null;
  }

  const product = (data as unknown as ProductDetail) ?? null;
  if (!product || product.farmer?.status !== "approved") return null;
  return product;
}

export const getCategories = unstable_cache(fetchCategories, ["shop-categories"], {
  revalidate: 300,
  tags: ["categories"],
});

export function getProducts(categorySlug?: string) {
  return unstable_cache(
    async () => fetchProducts(categorySlug),
    ["shop-products", categorySlug ?? "all"],
    { revalidate: 30, tags: ["products"] },
  )();
}

export function getProductById(id: string) {
  return unstable_cache(
    async () => fetchProductById(id),
    ["shop-product", id],
    { revalidate: 30, tags: ["products", `product-${id}`] },
  )();
}

async function fetchSimilarProductsByCategory(
  categorySlug: string,
  excludeProductId: string,
  limit: number,
): Promise<ProductListItem[]> {
  const supabase = createPublicClient();
  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (!category) return [];

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("category_id", category.id)
    .eq("status", "approved")
    .eq("in_stock", true)
    .neq("id", excludeProductId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[shop.getSimilarProductsByCategory]", error.message);
    return [];
  }

  return ((data ?? []) as unknown as ProductListItem[]).filter(
    (product) => product.farmer?.status === "approved",
  );
}

/** Same-category products from other farmers, used as a fallback when a
 * product's own farmer has no other listings to show as "similar". */
export function getSimilarProductsByCategory(
  categorySlug: string,
  excludeProductId: string,
  limit = 4,
) {
  return unstable_cache(
    async () => fetchSimilarProductsByCategory(categorySlug, excludeProductId, limit),
    ["similar-products-by-category", categorySlug, excludeProductId, String(limit)],
    { revalidate: 30, tags: ["products"] },
  )();
}
