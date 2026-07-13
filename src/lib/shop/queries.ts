import { createClient } from "@/lib/supabase/server";
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

export async function getCategories(): Promise<CategoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name_az, icon")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[shop.getCategories]", error.message);
    return [];
  }

  return data ?? [];
}

export async function getProducts(categorySlug?: string): Promise<ProductListItem[]> {
  const supabase = await createClient();

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

  return (data ?? []) as ProductListItem[];
}

export async function getProductById(id: string): Promise<ProductDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (error) {
    console.error("[shop.getProductById]", error.message);
    return null;
  }

  return data as ProductDetail;
}
