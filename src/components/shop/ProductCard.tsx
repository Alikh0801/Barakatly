import Link from "next/link";
import type { ProductListItem } from "@/types/shop";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
} from "@/lib/shop/format";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

function StarRow({ className }: { className: string }) {
  return (
    <span className={`flex ${className}`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
          <path d="M10 1.8l2.5 5.1 5.6.8-4 3.9.9 5.6L10 14.6l-5 2.6.9-5.6-4-3.9 5.6-.8L10 1.8Z" />
        </svg>
      ))}
    </span>
  );
}

/** Five stars filled to the average (4.3 fills four and a third), then the count. */
function CardRating({ average, count }: { average: number | null; count: number }) {
  const filled = average === null ? 0 : (Math.max(0, Math.min(5, Number(average))) / 5) * 100;
  const label =
    average === null
      ? "Hələ rəy yoxdur"
      : `Reytinq ${Number(average).toFixed(1).replace(".", ",")}, ${count} rəy`;

  return (
    <div className="mt-1.5 flex items-center gap-1.5" role="img" aria-label={label}>
      <span className="relative inline-flex" aria-hidden="true">
        <StarRow className="text-zinc-200" />
        <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${filled}%` }}>
          <StarRow className="text-amber-400" />
        </span>
      </span>
      <span className="text-[11px] text-zinc-500" aria-hidden="true">({count})</span>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = getProductImageUrl(product.product_images);
  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const outOfStock = !product.in_stock || product.quantity_available <= 0;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
      {/* data-static-hover: the global a:hover scale(1.02) would otherwise
          zoom the whole image link, which reads as the photo scaling. */}
      <div className="relative">
        <Link href={`/shop/${product.id}`} prefetch data-static-hover className="block">
          <div className="relative aspect-[4/3] overflow-hidden">
            {imageUrl ? (
              <ImageWithSkeleton
                src={imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
                skeletonClassName="rounded-none"
              />
            ) : (
              <ProductImagePlaceholder className="h-full w-full" />
            )}
            {outOfStock ? (
              // The photo keeps its colours; a soft strip over its foot says
              // it is sold out. z-20: the photo itself sits on z-10.
              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-rose-500/75 py-1.5 text-center text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                Stokda qalmayıb
              </span>
            ) : null}
          </div>
        </Link>
        {/* Outside the link, so a tap on the heart never opens the product. */}
        <WishlistButton
          productId={product.id}
          productTitle={product.title}
          // z-20: the photo itself sits on z-10 and would cover the heart.
          className="absolute right-2.5 top-2.5 z-20"
        />
      </div>

      <div className="p-3 sm:p-4">
        <Link href={`/shop/${product.id}`} prefetch>
          <div className="line-clamp-2 text-sm font-semibold text-zinc-900">
            {product.title}
          </div>
        </Link>
        <div className="mt-1 truncate text-xs text-zinc-500">
          {product.farmer?.farm_name ?? "Fermer"}
        </div>
        <CardRating average={product.rating_average ?? null} count={product.rating_count ?? 0} />
        {product.category ? (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex min-h-9 items-center justify-between gap-2">
          <div className="min-w-0 flex items-baseline gap-1">
            <span className="truncate text-sm font-semibold text-zinc-900">
              {formatPrice(price)}
            </span>
            <span className="shrink-0 text-xs text-zinc-500">
              {formatUnit(product.unit_type)}
            </span>
          </div>
          {outOfStock ? null : <AddToCartButton product={product} />}
        </div>
      </div>
    </article>
  );
}
