"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeftIcon, CheckIcon, MinusIcon, PlusIcon } from "@/components/app/icons";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { Spinner } from "@/components/ui/Spinner";
import { addToCart } from "@/lib/cart/actions";
import { farmerDisplayName } from "@/lib/farmers/name";
import { formatPrice, unitLabel } from "@/lib/shop/format";
import {
  formatQuantity,
  initialQuantity,
  minOrderQuantity,
  normalizeQuantity,
  quantityHasUnit,
  quantityStep,
} from "@/lib/shop/quantity";
import type { ProductRatingSummary, ProductReview } from "@/lib/shop/reviews";
import {
  defaultVariant,
  formatStock,
  isSoldByWeight,
  productVariants,
  variantInStock,
  variantLabel,
  variantPrice,
} from "@/lib/shop/variants";
import type { ProductDetail, ProductVariant } from "@/types/shop";

/**
 * The installed app's product screen (Figma "product-detail"): picture,
 * stock and place, title and price, sizes, the farmer, the description and
 * reviews, and a bar at the bottom with the amount and "Səbətə əlavə et".
 * Sizes, minimums and stock follow the website's rules. App only.
 */

function amountText(variant: ProductVariant, quantity: number): string {
  const amount = formatQuantity(variant.unit_type, quantity);
  if (quantityHasUnit(variant.unit_type)) return amount;
  const word = isSoldByWeight(variant.unit_type, variant.unit_size) ? "kq" : unitLabel(variant.unit_type);
  return word ? `${amount} ${word}` : amount;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-xs tracking-wide text-[#e0a526]" aria-label={`${rating} ulduz`}>
      {"★".repeat(rating)}
      <span className="text-app-line">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

function BuyBar({ product, variant }: { product: ProductDetail; variant: ProductVariant }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const unit = variant.unit_type;
  const stock = variant.quantity_available || 0;
  const min = minOrderQuantity(unit, product.min_order_quantity);
  // Weight changes in half kilos on the buttons (the site allows any 50 g
  // step; tapping through 50 g at a time would take too long).
  const step = unit === "kg" ? 0.5 : quantityStep(unit);
  const [quantity, setQuantity] = useState(() => initialQuantity(unit, min, stock) || min);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const outOfStock = !variantInStock(variant) || stock < min;

  function change(next: number) {
    const value = normalizeQuantity(unit, next, { min, max: Math.max(stock, min) });
    if (value > 0) setQuantity(value);
  }

  function add() {
    if (outOfStock) return;
    setError("");
    startTransition(async () => {
      const result = await addToCart(product.id, quantity, variant.id || undefined);
      if (result.needsAuth) {
        router.push(`/signin?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result.ok) setAdded(true);
      else setError(result.error ?? "Səbətə əlavə edilmədi.");
    });
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-app-line bg-app-bg/95 px-6 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur">
      {outOfStock ? (
        <p className="py-3 text-center text-sm font-semibold text-app-muted">Bu məhsul hazırda stokda yoxdur.</p>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">Məhsulun miqdarı:</span>
            <div className="flex items-center gap-3 rounded-full bg-[#f3eee2] p-1">
              <button
                type="button"
                data-static-hover
                onClick={() => change(quantity - step)}
                disabled={quantity - step < min - 1e-9}
                aria-label="Azalt"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white disabled:opacity-40"
              >
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="min-w-[3.5rem] text-center text-sm font-bold">{amountText(variant, quantity)}</span>
              <button
                type="button"
                data-static-hover
                onClick={() => change(quantity + step)}
                disabled={quantity + step > stock + 1e-9}
                aria-label="Artır"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-app-green text-white disabled:opacity-40"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          {error ? <p className="mt-2 text-center text-xs font-semibold text-rose-600">{error}</p> : null}
          {added ? (
            <Link
              href="/cart"
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-app-ink text-base font-bold text-white"
            >
              <CheckIcon className="h-5 w-5" />
              Səbətə əlavə olundu · Səbətə keç
            </Link>
          ) : (
            <button
              type="button"
              onClick={add}
              disabled={pending}
              data-static-hover
              className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-app-green text-base font-bold text-white disabled:opacity-70"
            >
              {pending ? <Spinner className="h-5 w-5" /> : null}
              Səbətə əlavə et • {formatPrice(variantPrice(variant) * quantity)}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function AppProductDetail({
  product,
  reviews,
  summary,
}: {
  product: ProductDetail;
  reviews: ProductReview[];
  summary: ProductRatingSummary;
}) {
  const router = useRouter();
  const variants = productVariants(product);
  const [selectedId, setSelectedId] = useState(() => defaultVariant(variants).id);
  const variant = variants.find((item) => item.id === selectedId) ?? defaultVariant(variants);
  const inStock = variantInStock(variant);
  const images = [...product.product_images].sort((a, b) => a.sort_order - b.sort_order);
  const farmer = product.farmer;
  const unit = unitLabel(variant.unit_type, variant.unit_size);

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/shop");
  }

  return (
    <div data-app-screen className="hidden min-h-dvh pb-44 font-app text-app-ink app:block">
      <header className="flex h-14 items-center justify-between px-4">
        <button
          type="button"
          onClick={goBack}
          aria-label="Geri"
          data-static-hover
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3eee2]"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <WishlistButton productId={product.id} productTitle={product.title} className="h-10 w-10" />
      </header>

      <div className="px-6">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-3xl [scrollbar-width:none]">
          {(images.length ? images : [null]).map((image, index) => (
            <div key={image?.url ?? index} className="relative h-[233px] w-full shrink-0 snap-center overflow-hidden rounded-3xl bg-[#f3eee2]">
              {image ? (
                <Image src={image.url} alt={index === 0 ? product.title : ""} fill sizes="100vw" className="object-cover" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${inStock ? "bg-[#e9f1e2] text-[#3b7a2c]" : "bg-rose-50 text-rose-700"}`}>
            {inStock ? `Anbarda ${formatStock(variant.unit_type, variant.quantity_available, variant.unit_size)}` : "Bitib"}
          </span>
          {farmer?.location_text ? (
            <span className="rounded-lg bg-[#fbefc4] px-2.5 py-1 text-xs font-semibold text-[#8a5a00]">{farmer.location_text}</span>
          ) : null}
        </div>

        <h1 className="mt-3 font-app-display text-[22px] leading-tight font-bold [overflow-wrap:anywhere]">{product.title}</h1>
        <p className="mt-1 flex items-baseline gap-1">
          <span className="font-app-display text-xl font-bold text-[#3b7a2c]">{formatPrice(variantPrice(variant))}</span>
          {unit ? <span className="text-sm text-app-muted">/ {unit}</span> : null}
        </p>
        {summary.total > 0 ? (
          <p className="mt-1 text-xs text-app-muted">
            ★ {summary.average.toFixed(1)} · {summary.total} rəy · {product.sold_count} satış
          </p>
        ) : null}

        {variants.length > 1 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {variants.map((item) => {
              const on = item.id === variant.id;
              const available = variantInStock(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-static-hover
                  onClick={() => setSelectedId(item.id)}
                  disabled={!available}
                  aria-pressed={on}
                  className={`rounded-2xl px-3.5 py-2 text-[13px] ${
                    on ? "bg-app-green font-bold text-white" : "bg-[#f3eee2] font-medium"
                  } ${available ? "" : "line-through opacity-50"}`}
                >
                  {variantLabel(item.unit_type, item.unit_size)} · {formatPrice(variantPrice(item))}
                </button>
              );
            })}
          </div>
        ) : null}

        {farmer ? (
          <Link
            href={`/farmers/${farmer.id}`}
            className="mt-5 flex items-center gap-3 rounded-2xl bg-white p-4"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e9f1e2] text-sm font-bold text-[#3b7a2c]">
              {farmer.avatar_url ? (
                <Image src={farmer.avatar_url} alt="" width={44} height={44} className="h-full w-full object-cover" />
              ) : (
                farmerDisplayName(farmer.owner_name).slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-app-muted">Fermer</span>
              <span className="block truncate text-[15px] font-bold text-[#3b7a2c]">{farmerDisplayName(farmer.owner_name)}</span>
            </span>
            <span aria-hidden="true" className="text-xl text-app-muted">›</span>
          </Link>
        ) : null}

        {product.description ? (
          <section className="mt-6">
            <h2 className="font-app-display text-base font-bold">Təsvir</h2>
            <p className="mt-2 text-sm leading-6 whitespace-pre-line text-app-muted [overflow-wrap:anywhere]">{product.description}</p>
          </section>
        ) : null}

        {reviews.length > 0 ? (
          <section className="mt-6">
            <h2 className="font-app-display text-base font-bold">Rəylər ({reviews.length})</h2>
            <ul className="mt-3 space-y-3">
              {reviews.slice(0, 10).map((review) => (
                <li key={review.id} className="rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-bold">{review.customerName}</span>
                    <Stars rating={review.rating} />
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-app-muted [overflow-wrap:anywhere]">{review.comment}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* Keyed by size, so another size starts its amount afresh. */}
      <BuyBar key={variant.id} product={product} variant={variant} />
    </div>
  );
}
