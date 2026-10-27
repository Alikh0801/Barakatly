import { getPublicFarmers, type PublicFarmer } from "@/lib/farmers/queries";
import { getProducts } from "@/lib/shop/queries";
import { azNormalize } from "@/lib/shop/normalize";
import type { ProductListItem } from "@/types/shop";

export type SearchResults = {
  query: string;
  products: ProductListItem[];
  farmers: PublicFarmer[];
};

const MAX_RESULTS = 24;

/**
 * Products (by title or farmer name) and farmers (by name) matching the
 * query, case and Azerbaijani letters aside: "inək", "İnək" and "inek" all
 * find "İnək südü". Both lists are the cached shop lists filtered here;
 * the database's ILIKE folds only Latin letters, so "inək" missed "İnək".
 */
export async function searchCatalog(query: string): Promise<SearchResults> {
  const q = query.trim();
  const needle = azNormalize(q);
  if (!needle) {
    return { query: q, products: [], farmers: [] };
  }

  const [products, farmers] = await Promise.all([getProducts(), getPublicFarmers()]);

  return {
    query: q,
    // Already in stock first, then newest.
    products: products
      .filter((product) =>
        azNormalize(`${product.title} ${product.farmer?.owner_name ?? ""}`).includes(needle),
      )
      .slice(0, MAX_RESULTS),
    farmers: farmers
      .filter((farmer) => azNormalize(farmer.owner_name ?? "").includes(needle))
      .slice(0, MAX_RESULTS),
  };
}
