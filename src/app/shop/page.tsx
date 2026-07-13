import { CategoryFilter } from "@/components/shop/CategoryFilter";
import { ProductCard } from "@/components/shop/ProductCard";
import { getCategories, getProducts } from "@/lib/shop/queries";

export const metadata = {
  title: "Mağaza — BARAKATLY",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categorySlug = params.category;

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(categorySlug),
  ]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Mağaza
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Təzə və yerli fermer məhsullarını kəşf edin
        </p>
      </div>

      <div className="mt-8">
        <CategoryFilter categories={categories} activeSlug={categorySlug} />
      </div>

      {activeCategory ? (
        <p className="mt-6 text-sm text-zinc-600">
          Kateqoriya: <span className="font-medium">{activeCategory.name_az}</span>
        </p>
      ) : null}

      {products.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="text-lg font-medium text-zinc-900">
            Hazırda məhsul tapılmadı
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Supabase-də demo məhsulları yükləmək üçün{" "}
            <code className="rounded bg-zinc-100 px-1">
              004_demo_products.sql
            </code>{" "}
            migration-ını işlədin.
          </p>
        </div>
      )}
    </div>
  );
}
