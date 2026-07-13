"use client";

import { useCartStore } from "@/store/cart";
import type { ProductListItem } from "@/types/shop";
import {
  formatPrice,
  formatUnit,
  getDisplayPrice,
  getProductImageUrl,
} from "@/lib/shop/format";

export function AddToCartButton({
  product,
  className = "",
}: {
  product: ProductListItem;
  className?: string;
}) {
  const addItem = useCartStore((s) => s.addItem);

  const price = getDisplayPrice(product.final_price, product.farmer_price);

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          productId: product.id,
          title: product.title,
          price,
          unitType: product.unit_type,
          imageUrl: getProductImageUrl(product.product_images),
          farmerId: product.farmer?.id ?? "",
          farmerName: product.farmer?.farm_name ?? "Fermer",
        })
      }
      className={[
        "inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-500",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${product.title} səbətə əlavə et`}
    >
      +
    </button>
  );
}

export function AddToCartButtonLarge({
  product,
}: {
  product: ProductListItem;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const price = getDisplayPrice(product.final_price, product.farmer_price);

  return (
    <button
      type="button"
      onClick={() =>
        addItem({
          productId: product.id,
          title: product.title,
          price,
          unitType: product.unit_type,
          imageUrl: getProductImageUrl(product.product_images),
          farmerId: product.farmer?.id ?? "",
          farmerName: product.farmer?.farm_name ?? "Fermer",
        })
      }
      className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
    >
      Səbətə əlavə et — {formatPrice(price)}
      {formatUnit(product.unit_type)}
    </button>
  );
}
