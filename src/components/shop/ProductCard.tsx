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

export function ProductCard({ product }: { product: ProductListItem }) {
  const imageUrl = getProductImageUrl(product.product_images);
  const price = getDisplayPrice(product.final_price, product.farmer_price);

  return (
    <article className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md">
      <Link href={`/shop/${product.id}`} prefetch className="block">
        <div className="relative overflow-hidden">
          <ImageWithSkeleton
            src={
              imageUrl ??
              "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80"
            }
            alt={product.title}
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            skeletonClassName="rounded-none"
          />
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/shop/${product.id}`} prefetch>
          <div className="text-sm font-semibold text-zinc-900">{product.title}</div>
        </Link>
        <div className="mt-1 text-xs text-zinc-500">
          {product.farmer?.farm_name ?? "Fermer"}
        </div>
        {product.category ? (
          <div className="mt-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
              {product.category.name_az}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-zinc-900">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-zinc-500">
              {formatUnit(product.unit_type)}
            </span>
          </div>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
