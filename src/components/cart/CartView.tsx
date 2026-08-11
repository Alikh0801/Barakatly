"use client";

import Link from "next/link";
import { useMemo, useTransition } from "react";
import {
  clearCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/cart/actions";
import type { CartLineItem } from "@/lib/cart/queries";
import { formatPrice } from "@/lib/shop/format";
import { DELIVERY_FEE } from "@/lib/checkout/constants";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";

function groupByFarmer(items: CartLineItem[]) {
  const groups = new Map<
    string,
    { farmerId: string; farmerName: string; items: CartLineItem[] }
  >();

  for (const item of items) {
    const key = item.farmerId || item.farmerName || "unknown";
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, {
        farmerId: item.farmerId,
        farmerName: item.farmerName || "Fermer",
        items: [item],
      });
    }
  }

  return [...groups.values()];
}

export function CartView({ items }: { items: CartLineItem[] }) {
  const [pending, startTransition] = useTransition();

  const groups = useMemo(() => groupByFarmer(items), [items]);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  function changeQuantity(productId: string, quantity: number) {
    startTransition(async () => {
      await setCartQuantity(productId, quantity);
    });
  }

  function remove(productId: string) {
    startTransition(async () => {
      await removeFromCart(productId);
    });
  }

  function clear() {
    startTransition(async () => {
      await clearCart();
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Səbətiniz boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Mağazadan məhsul seçib səbətə əlavə edin.
        </p>
        <Link
          href="/shop"
          prefetch
          className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Mağazaya keç
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-8 lg:grid-cols-[1fr_360px] ${pending ? "opacity-70" : ""}`}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.farmerId || group.farmerName}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-zinc-900">
                {group.farmerName}
              </h2>
              {group.farmerId ? (
                <Link
                  href={`/farmers/${group.farmerId}`}
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  Fermer profili
                </Link>
              ) : null}
            </div>
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                    {item.imageUrl ? (
                      <ImageWithSkeleton
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        skeletonClassName="rounded-xl"
                      />
                    ) : null}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/shop/${item.productId}`}
                          className="block truncate font-semibold text-zinc-900 hover:text-emerald-700"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatPrice(item.price)} / vahid
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.productId)}
                        disabled={pending}
                        className="shrink-0 text-xs text-zinc-500 hover:text-rose-600 disabled:opacity-60"
                      >
                        Sil
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="inline-flex items-center rounded-full bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200">
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.productId, item.quantity - 1)
                          }
                          disabled={pending}
                          className="px-3 py-1 text-sm font-medium text-zinc-900 hover:text-emerald-700 disabled:opacity-60"
                          aria-label="Miqdarı azalt"
                        >
                          −
                        </button>
                        <span className="min-w-8 text-center text-sm font-semibold text-zinc-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            changeQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={pending || item.quantity >= item.maxQuantity}
                          className="px-3 py-1 text-sm font-medium text-zinc-900 hover:text-emerald-700 disabled:opacity-40"
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
            </div>
          </section>
        ))}

        <button
          type="button"
          onClick={clear}
          disabled={pending}
          className="text-sm text-zinc-500 hover:text-rose-600 disabled:opacity-60"
        >
          Səbəti təmizlə
        </button>
      </div>

      <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Sifariş xülasəsi</h2>
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between text-zinc-700">
            <span>Məhsulların cəmi</span>
            <span className="font-medium text-zinc-900">
              {formatPrice(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-zinc-700">
            <span>Kuryer haqqı</span>
            <span className="font-medium text-zinc-900">
              {formatPrice(DELIVERY_FEE)}
            </span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold text-zinc-900">
            <span>Ümumi</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Link
          href="/checkout"
          prefetch
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Ödə
        </Link>
      </aside>
    </div>
  );
}
