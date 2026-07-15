import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductCard } from "@/components/shop/ProductCard";
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
    <>
      <div className="mt-8">
        <CategoryFilter categories={categories} activeSlug={categorySlug} />
      </div>

      {activeCategory ? (
        <p className="mt-6 text-sm text-zinc-600">
          Kateqoriya:{" "}
          <span className="font-medium">{activeCategory.name_az}</span>
        </p>
      ) : null}

      {products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="text-lg font-medium text-zinc-900">
            Hazırda məhsul yoxdur
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            Fermerlərin əlavə etdiyi məhsullar admin təsdiqindən sonra burada
            görünəcək.
          </p>
        </div>
      )}
    </>
  );
}
