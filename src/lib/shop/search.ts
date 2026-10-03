import { escapeLike } from "@/lib/supabase/like";
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
  // Escape, never strip: stripping turned a query of just "%" or "_" into
  // the pattern "%%", which matched every row.
  const pattern = `%${escapeLike(q)}%`;
  // `*` can only be approximated in a PostgREST pattern (see escapeLike),
  // so for those queries re-check the rows for the literal text.
  const needle = q.toLowerCase();
  const matchesLiterally = (text: string | null | undefined) =>
    !q.includes("*") || (text ?? "").toLowerCase().includes(needle);

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
      .ilike("title", pattern)
      // Sold-out products still show up, just below the in-stock ones.
      .order("in_stock", { ascending: false })
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
        created_at,
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

  const farmers: PublicFarmer[] = (farmersResult.data ?? [])
    .filter((farmer) => matchesLiterally(farmer.farm_name))
    .map((farmer) => {
    const products = Array.isArray(farmer.products) ? farmer.products : [];
    return {
      id: farmer.id,
      farm_name: farmer.farm_name,
      owner_name: null,
      description: farmer.description,
      location_text: farmer.location_text,
      verified_at: farmer.verified_at,
      avatar_url: farmer.avatar_url ?? null,
      productCount: products.filter((p) => p.status === "approved").length,
      created_at: farmer.created_at,
    };
  });

  return {
    query: q,
    products: ((productsResult.data ?? []) as unknown as ProductListItem[]).filter(
      (product) =>
        product.farmer?.status === "approved" && matchesLiterally(product.title),
    ),
    farmers,
  };
}
