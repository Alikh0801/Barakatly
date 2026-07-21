import { createPublicClient } from "@/lib/supabase/public";
import type { ProductListItem } from "@/types/shop";
import type { PublicFarmer } from "@/lib/farmers/queries";

export type SearchResults = {
  query: string;
  products: ProductListItem[];
  farmers: PublicFarmer[];
};

export async function searchCatalog(query: string): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return { query: q, products: [], farmers: [] };
  }

  const supabase = createPublicClient();
  const pattern = `%${q.replace(/[%_]/g, "")}%`;

  const [productsResult, farmersResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
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
      `,
      )
      .eq("status", "approved")
      .eq("in_stock", true)
      .ilike("title", pattern)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("farmers")
      .select(
        `
        id,
        farm_name,
        description,
        location_text,
        verified_at,
        avatar_url,
        products ( id, status )
      `,
      )
      .eq("status", "approved")
      .ilike("farm_name", pattern)
      .order("farm_name", { ascending: true })
      .limit(24),
  ]);

  if (productsResult.error) {
    console.error("[shop.searchCatalog.products]", productsResult.error.message);
  }
  if (farmersResult.error) {
    console.error("[shop.searchCatalog.farmers]", farmersResult.error.message);
  }

  const farmers: PublicFarmer[] = (farmersResult.data ?? []).map((farmer) => {
    const products = Array.isArray(farmer.products) ? farmer.products : [];
    return {
      id: farmer.id,
      farm_name: farmer.farm_name,
      description: farmer.description,
      location_text: farmer.location_text,
      verified_at: farmer.verified_at,
      avatar_url: farmer.avatar_url ?? null,
      productCount: products.filter((p) => p.status === "approved").length,
    };
  });

  return {
    query: q,
    products: (productsResult.data ?? []) as unknown as ProductListItem[],
    farmers,
  };
}
