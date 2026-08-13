"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart/actions";
import type { ProductListItem } from "@/types/shop";
import { formatPrice, formatUnit, getDisplayPrice } from "@/lib/shop/format";

function useAddToCart() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  function add(productId: string, quantity = 1) {
    setError("");
    startTransition(async () => {
      const result = await addToCart(productId, quantity);
      if (result.needsAuth) {
        router.push(`/signin?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (result.ok) {
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
        return;
      }
      setError(result.error ?? "Səbətə əlavə edilmədi.");
      window.setTimeout(() => setError(""), 3000);
    });
  }

  return { add, pending, added, error };
}

export function AddToCartButton({
  product,
  className = "",
}: {
  product: ProductListItem;
  className?: string;
}) {
  const { add, pending, added, error } = useAddToCart();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => add(product.id)}
      title={error || undefined}
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition disabled:opacity-60",
        error ? "bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={error || `${product.title} səbətə əlavə et`}
    >
      {added ? "✓" : error ? "✕" : "+"}
    </button>
  );
}

export function AddToCartButtonLarge({
  product,
}: {
  product: ProductListItem;
}) {
  const { add, pending, added, error } = useAddToCart();
  const price = getDisplayPrice(product.final_price, product.farmer_price);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => add(product.id)}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {added
          ? "Səbətə əlavə olundu"
          : `Səbətə əlavə et — ${formatPrice(price)}${formatUnit(product.unit_type)}`}
      </button>
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
