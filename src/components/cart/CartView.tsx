"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/shop/format";

const DELIVERY_FEE = 5;

export function CartView() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Səbətiniz boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Mağazadan məhsul seçib səbətə əlavə edin.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Mağazaya keç
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/shop/${item.productId}`}
                    className="font-semibold text-zinc-900 hover:text-emerald-700"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500">{item.farmerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="text-xs text-zinc-500 hover:text-rose-600"
                >
                  Sil
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="inline-flex items-center rounded-full bg-zinc-100 ring-1 ring-zinc-200">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    className="px-3 py-1 text-sm"
                    aria-label="Miqdarı azalt"
                  >
                    −
                  </button>
                  <span className="min-w-8 text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="px-3 py-1 text-sm"
                    aria-label="Miqdarı artır"
                  >
                    +
                  </button>
                </div>
                <div className="text-sm font-semibold text-zinc-900">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={clearCart}
          className="text-sm text-zinc-500 hover:text-rose-600"
        >
          Səbəti təmizlə
        </button>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Sifariş xülasəsi</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500">Məhsullar</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Çatdırılma</span>
            <span>{formatPrice(DELIVERY_FEE)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-3 flex justify-between font-semibold">
            <span>Cəmi</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <button
          type="button"
          disabled
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white opacity-60"
        >
          Ödəniş (tezliklə)
        </button>
      </aside>
    </div>
  );
}
