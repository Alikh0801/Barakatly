import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import type { ProductListItem } from "@/types/shop";

export function SimilarProducts({
  title,
  products,
  viewAllHref,
}: {
  title: string;
  products: ProductListItem[];
  viewAllHref: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          {title}
        </h2>
        <Link
          href={viewAllHref}
          prefetch
          className="shrink-0 text-sm font-medium text-emerald-700 hover:underline"
        >
          Hamısına bax →
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
