import { escapeLike } from "@/lib/supabase/like";
import { createPublicClient } from "@/lib/supabase/public";
import { VARIANTS_SELECT } from "@/lib/shop/variants";
import type { ProductListItem } from "@/types/shop";
import { getPublicFarmers, type PublicFarmer } from "@/lib/farmers/queries";
import { azNormalize } from "@/lib/shop/normalize";

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
  // Matched against products.search_text (title and farmer name in
  // azNormalize form), so the letters typed don't need to be Azerbaijani.
  const needle = azNormalize(q);
  // Escape, never strip: stripping turned a query of just "%" or "_" into
  // the pattern "%%", which matched every row.
  const pattern = `%${escapeLike(needle)}%`;
  // `*` can only be approximated in a PostgREST pattern (see escapeLike),
  // so for those queries re-check the rows for the literal text.
  const matchesLiterally = (text: string) => !q.includes("*") || azNormalize(text).includes(needle);

  const [productsResult, allFarmers] = await Promise.all([
    supabase
      .from("products")
      .select(
        `
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
        farmer:farmers (
          id,
          owner_name,
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
        ),
        ${VARIANTS_SELECT}
      `,
      )
      .eq("status", "approved")
      .ilike("search_text", pattern)
      // Sold-out products still show up, just below the in-stock ones.
      .order("in_stock", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(24),
    // Few farmers, and their name lives in profiles: filter the cached
    // public list here with the same rule.
    getPublicFarmers(),
  ]);

  if (productsResult.error) {
    console.error("[shop.searchCatalog.products]", productsResult.error.message);
  }

  const farmers = allFarmers
    .filter((farmer) => azNormalize(farmer.owner_name ?? "").includes(needle))
    .slice(0, 24);

  return {
    query: q,
    products: ((productsResult.data ?? []) as unknown as ProductListItem[]).filter(
      (product) =>
        product.farmer?.status === "approved" &&
        matchesLiterally(`${product.title} ${product.farmer.owner_name ?? ""}`),
    ),
    farmers,
  };
}
