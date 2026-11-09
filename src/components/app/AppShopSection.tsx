import { AppShop } from "@/components/app/AppShop";
import { getProducts, getVisibleCategories } from "@/lib/shop/queries";

/** The app's product list, with the shop's own (cached) data. */
export async function AppShopSection({ categorySlug }: { categorySlug?: string }) {
  const [products, categories] = await Promise.all([getProducts(categorySlug), getVisibleCategories()]);
  return <AppShop products={products} categories={categories} activeSlug={categorySlug} />;
}
