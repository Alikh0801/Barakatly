import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { getCategories, getProducts } from "@/lib/shop/queries";

export async function CategorySection({
  categorySlug,
}: {
  categorySlug?: string;
}) {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(categorySlug),
  ]);

  if (categories.length === 0) {
    return null;
  }

  const activeCategory = categories.find(
    (category) => category.slug === categorySlug,
  );

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Kateqoriyalar üzrə alış
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Fermer məhsullarından ibarət seçməni gözdən keçirin
          </p>
        </div>

        <div className="mt-10 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max min-w-full items-start justify-center gap-4 md:gap-6">
            <Link
              href="/"
              prefetch
              scroll={false}
              className="group flex w-[88px] shrink-0 flex-col items-center text-center sm:w-[104px]"
            >
              <span
                className={[
                  "inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ring-1 transition sm:h-[72px] sm:w-[72px]",
                  !categorySlug
                    ? "bg-emerald-600 text-white ring-emerald-600"
                    : "bg-zinc-50 text-zinc-700 ring-zinc-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 group-hover:ring-emerald-200",
                ].join(" ")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-6 w-6"
                  aria-hidden="true"
                >
                  <path
                    d="M4 6h4v4H4V6Zm6 0h4v4h-4V6Zm6 0h4v4h-4V6ZM4 12h4v4H4v-4Zm6 0h4v4h-4v-4Zm6 0h4v4h-4v-4ZM4 18h4v4H4v-4Zm6 0h4v4h-4v-4Zm6 0h4v4h-4v-4Z"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className={[
                  "mt-3 text-xs font-medium leading-snug transition",
                  !categorySlug
                    ? "text-emerald-700"
                    : "text-zinc-800 group-hover:text-emerald-700",
                ].join(" ")}
              >
                Bütün məhsullar
              </span>
            </Link>

            {categories.map((category) => {
              const active = categorySlug === category.slug;
              return (
                <Link
                  key={category.id}
                  href={`/?category=${category.slug}`}
                  prefetch
                  scroll={false}
                  className="group flex w-[88px] shrink-0 flex-col items-center text-center sm:w-[104px]"
                >
                  <span
                    className={[
                      "relative inline-flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl ring-1 transition sm:h-[72px] sm:w-[72px]",
                      active
                        ? "ring-2 ring-emerald-600"
                        : "ring-zinc-200 group-hover:ring-emerald-300",
                    ].join(" ")}
                  >
                    {category.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={category.image_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center bg-zinc-100 text-2xl"
                      >
                        {category.icon ?? "🌿"}
                      </span>
                    )}
                    {active ? (
                      <span className="pointer-events-none absolute inset-0 bg-emerald-600/15" />
                    ) : null}
                  </span>
                  <span
                    className={[
                      "mt-3 text-xs font-medium leading-snug transition",
                      active
                        ? "text-emerald-700"
                        : "text-zinc-800 group-hover:text-emerald-700",
                    ].join(" ")}
                  >
                    {category.name_az}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h3 className="text-lg font-semibold text-zinc-900">
              {activeCategory?.name_az ?? "Bütün məhsullar"}
            </h3>
            <Link
              href={
                categorySlug ? `/shop?category=${categorySlug}` : "/shop"
              }
              prefetch
              className="shrink-0 text-sm font-semibold text-emerald-700 hover:underline"
            >
              Mağazaya keç →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
              Hazırda satışda məhsul yoxdur. Fermerlərin əlavə etdiyi
              məhsullar admin təsdiqindən sonra burada görünəcək.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
