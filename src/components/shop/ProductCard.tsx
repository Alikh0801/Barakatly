"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductListItem } from "@/types/shop";
import { formatPrice, formatUnit, getProductImageUrl } from "@/lib/shop/format";
import {
  defaultVariant,
  formatStock,
  productVariants,
  variantInStock,
  variantLabel,
  variantPrice,
} from "@/lib/shop/variants";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";
import { farmerDisplayName } from "@/lib/farmers/name";

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

/**
 * A product in a catalog. "grid" is the usual tile; "list" lays the same
 * card out in a row (photo left, details right) for the shop's list view.
 */
export function ProductCard({
  product,
  layout = "grid",
}: {
  product: ProductListItem;
  layout?: "grid" | "list";
}) {
  const list = layout === "list";
  const variants = productVariants(product);
  const [selectedId, setSelectedId] = useState(() => defaultVariant(variants).id);
  const selected = variants.find((variant) => variant.id === selectedId) ?? defaultVariant(variants);
  const hasSizes = variants.length > 1;
  const imageUrl = selected.image_url ?? getProductImageUrl(product.product_images);
  const price = variantPrice(selected);
  // Sold out only once every size is.
  const outOfStock = !variants.some(variantInStock);

  return (
    // Hover: the card rises a little with a soft green shadow and the name
    // turns green. As a tile, a column the height of its grid row, so the
    // price row sits at the foot, level with its neighbours', however long
    // the title.
    <article className={`group flex overflow-hidden rounded-2xl ${list ? "flex-row" : "h-full flex-col"} bg-white shadow-sm ring-1 ring-zinc-200 transition duration-300 ease-out hover:shadow-[0_14px_30px_-14px_rgba(31,77,44,0.35)] hover:ring-emerald-200 motion-safe:hover:-translate-y-1`}>
      {/* data-static-hover: the global a:hover scale(1.02) would otherwise
          zoom the whole image link, which reads as the photo scaling. */}
      <div className={list ? "relative w-32 shrink-0 sm:w-56" : "relative"}>
        <Link href={`/shop/${product.id}`} prefetch data-static-hover className="block h-full">
          <div
            className={
              list
                ? "relative h-full min-h-32 overflow-hidden sm:min-h-40"
                : "relative aspect-[4/3] overflow-hidden"
            }
          >
            {imageUrl ? (
              <ImageWithSkeleton
                key={imageUrl}
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
              <span className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-rose-500/85 py-1.5 text-center text-xs font-semibold tracking-wide text-white">
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
          className={`absolute z-20 ${list ? "right-2 top-2" : "right-2.5 top-2.5"}`}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
        <Link href={`/shop/${product.id}`} prefetch data-static-hover>
          <div className="break-words text-sm font-semibold text-zinc-900 transition-colors group-hover:text-emerald-700">
            {product.title}
          </div>
        </Link>
        <div className="mt-1 truncate text-xs text-zinc-500">
          {farmerDisplayName(product.farmer?.owner_name)}
        </div>
        <CardRating average={product.rating_average ?? null} count={product.rating_count ?? 0} />
        {list && product.description ? (
          <p className="mt-2 hidden text-sm leading-relaxed text-zinc-600 sm:line-clamp-2">
            {product.description}
          </p>
        ) : null}
        {product.category ? (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          </div>
        ) : null}

        {hasSizes ? (
          <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Ölçü">
            {variants.map((variant) => {
              const available = variantInStock(variant);
              const active = variant.id === selected.id;
              return (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => setSelectedId(variant.id)}
                  disabled={!available}
                  aria-pressed={active}
                  title={available ? undefined : "Bitib"}
                  className={[
                    "rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 transition",
                    !available
                      ? "cursor-not-allowed bg-zinc-100 text-zinc-400 line-through ring-zinc-200"
                      : active
                        ? "bg-emerald-600 text-white ring-emerald-600"
                        : "bg-white text-zinc-700 ring-zinc-200 hover:ring-emerald-300",
                  ].join(" ")}
                >
                  {variantLabel(variant.unit_type, variant.unit_size)} · {formatPrice(variantPrice(variant)).replace(".00", "")}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* The price is never cut short. On a phone the unit ("/banka
            (0,7 kq)") takes its own line under it, the full card wide, on
            every card alike so neighbours stay level; from sm it sits beside
            the price. */}
        <div className="mt-auto pt-3">
          <div className="flex min-h-9 items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-baseline gap-1">
                <span className="whitespace-nowrap text-sm font-semibold text-zinc-900">
                  {formatPrice(price)}
                </span>
                <span className="hidden truncate text-xs text-zinc-500 sm:inline">
                  {formatUnit(selected.unit_type, selected.unit_size)}
                </span>
              </div>
              {hasSizes && !outOfStock ? (
                <div className="hidden text-[11px] text-zinc-500 sm:block">
                  Stokda: {formatStock(selected.unit_type, selected.quantity_available, selected.unit_size)}
                </div>
              ) : null}
            </div>
            {outOfStock ? null : (
              <AddToCartButton product={product} variantId={selected.id || undefined} />
            )}
          </div>
          <div className="mt-0.5 truncate text-xs text-zinc-500 sm:hidden">
            {formatUnit(selected.unit_type, selected.unit_size)}
          </div>
          {hasSizes && !outOfStock ? (
            <div className="truncate text-[11px] text-zinc-500 sm:hidden">
              Stokda: {formatStock(selected.unit_type, selected.quantity_available, selected.unit_size)}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
