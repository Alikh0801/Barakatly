import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { getCategories, getProducts } from "@/lib/shop/queries";

export async function ShopContent({
  categorySlug,
}: {
  categorySlug?: string;
}) {
  const [categories, products] = await Promise.all([
    getCategories(),
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
