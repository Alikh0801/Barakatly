import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { getProducts, getVisibleCategories } from "@/lib/shop/queries";

export async function ShopContent({
  categorySlug,
}: {
  categorySlug?: string;
}) {
  const [categories, products] = await Promise.all([
    getVisibleCategories(),
    getProducts(categorySlug),
  ]);

  const activeCategory = categories.find((category) => category.slug === categorySlug);

  return (
    <ShopBrowser
      products={products}
      categoryFilter={
        <CategoryFilter categories={categories} activeSlug={categorySlug} />
      }
      activeCategoryName={activeCategory?.name_az ?? null}
    />
  );
}
