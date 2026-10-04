import Link from "next/link";
import type { ProductListItem } from "@/types/shop";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
} from "@/lib/shop/format";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";
import { ProductImagePlaceholder } from "@/components/shop/ProductImagePlaceholder";

export function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = getProductImageUrl(product.product_images);
  const price = getDisplayPrice(product.final_price, product.farmer_price);
  const outOfStock = !product.in_stock || product.quantity_available <= 0;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
      {/* data-static-hover: the global a:hover scale(1.02) would otherwise
          zoom the whole image link, which reads as the photo scaling. */}
      <Link href={`/shop/${product.id}`} prefetch data-static-hover className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {imageUrl ? (
            <ImageWithSkeleton
              src={imageUrl}
              alt={product.title}
              className={[
                "h-full w-full object-cover",
                outOfStock ? "opacity-60 grayscale" : "",
              ].join(" ")}
              skeletonClassName="rounded-none"
            />
          ) : (
            <ProductImagePlaceholder className="h-full w-full" />
          )}
        </div>
      </Link>

      <div className="p-3 sm:p-4">
        <Link href={`/shop/${product.id}`} prefetch>
          <div className="line-clamp-2 text-sm font-semibold text-zinc-900">
            {product.title}
          </div>
        </Link>
        <div className="mt-1 truncate text-xs text-zinc-500">
          {product.farmer?.farm_name ?? "Fermer"}
        </div>
        {product.category ? (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
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

        {outOfStock ? (
          <p className="mt-2 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
            Stokda qalmayıb
          </p>
        ) : null}
      </div>
    </article>
  );
}
