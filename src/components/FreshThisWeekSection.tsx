import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { getProducts } from "@/lib/shop/queries";

export async function FreshThisWeekSection() {
  const products = (await getProducts()).slice(0, 4);

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Bu həftə təzə
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Fermerlərimizin təsdiqlənmiş məhsulları
            </p>
          </div>
          <Link
            href="/shop"
            prefetch
            className="hidden items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100 sm:inline-flex"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 sm:hidden">
          <Link
            href="/shop"
            prefetch
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
          >
            Hamısına bax
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
