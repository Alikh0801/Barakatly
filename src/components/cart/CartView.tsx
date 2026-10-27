"use client";

import Image from "next/image";
import Link, { useLinkStatus } from "next/link";
import { useActionState, useMemo, useState, useTransition } from "react";
import {
  clearCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/cart/actions";
import type { CartLineItem } from "@/lib/cart/queries";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import { DELIVERY_FEE } from "@/lib/checkout/constants";
import { applyPromoCode, removePromoCode } from "@/lib/promo/actions";
import type { AppliedPromo } from "@/lib/promo/constants";
import { Spinner } from "@/components/ui/Spinner";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { formatAmount } from "@/lib/shop/quantity";
import { ImageWithSkeleton } from "@/components/ui/ImageWithSkeleton";

function groupByFarmer(items: CartLineItem[]) {
  const groups = new Map<
    string,
    { farmerId: string; farmerName: string; farmerAvatarUrl: string | null; items: CartLineItem[] }
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
        farmerAvatarUrl: item.farmerAvatarUrl,
        items: [item],
      });
    }
  }

  return [...groups.values()];
}

function FarmerAvatar({ name, url }: { name: string; url: string | null }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-700 text-xs font-semibold text-white ring-2 ring-white shadow-sm">
      {url ? (
        <Image src={url} alt="" fill sizes="32px" className="object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

/** The promo code field in the order summary, or the code once applied. */
function PromoCodeBox({ promo }: { promo: AppliedPromo | null }) {
  const [state, applyAction, applying] = useActionState(applyPromoCode, {});
  const [removing, startRemove] = useTransition();

  if (promo) {
    return (
      <div
        className={`rounded-xl px-3 py-2.5 text-sm ring-1 ${
          promo.error ? "bg-amber-50 ring-amber-200" : "bg-emerald-50 ring-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className={`font-semibold tracking-wide ${promo.error ? "text-amber-900" : "text-emerald-800"}`}>
              {promo.code}
            </p>
            {promo.name && !promo.error ? (
              <p className="truncate text-xs text-emerald-700">{promo.name}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => startRemove(() => removePromoCode())}
            disabled={removing}
            className="shrink-0 text-xs font-medium text-zinc-500 hover:text-rose-600 disabled:opacity-60"
          >
            {removing ? "Silinir..." : "Sil"}
          </button>
        </div>
        {promo.error ? <p className="mt-1 text-xs text-amber-800">{promo.error}</p> : null}
      </div>
    );
  }

  return (
    <form action={applyAction}>
      <label htmlFor="promo-code" className="text-sm font-medium text-zinc-700">
        Promokod
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="promo-code"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={30}
          placeholder="Kodu daxil edin"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base uppercase text-zinc-900 outline-none ring-emerald-500 placeholder:normal-case focus:ring-2 sm:text-sm"
        />
        <button
          type="submit"
          disabled={applying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-70"
        >
          {applying ? <Spinner className="h-3.5 w-3.5" /> : null}
          Tətbiq et
        </button>
      </div>
      {state.error ? (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

/** Spins while the link it sits in is still loading its page. */
function LinkSpinner() {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className="h-4 w-4" /> : null;
}

export function CartView({
  items,
  promo,
}: {
  items: CartLineItem[];
  promo: AppliedPromo | null;
}) {
  const [pending, startTransition] = useTransition();
  // What the running update is for, so its own control shows the spinner.
  const [busy, setBusy] = useState<string | null>(null);

  const groups = useMemo(() => groupByFarmer(items), [items]);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = promo && !promo.error ? Math.min(promo.discount, subtotal) : 0;
  const total = subtotal - discount + (items.length > 0 ? DELIVERY_FEE : 0);
  // Stock can drop after an item was added, so catch it here instead of
  // letting checkout fail with OUT_OF_STOCK.
  const hasStockIssue = items.some(
    (item) =>
      item.maxQuantity < item.minQuantity ||
      item.quantity > item.maxQuantity ||
      item.quantity < item.minQuantity,
  );

  function run(key: string, task: () => Promise<unknown>) {
    setBusy(key);
    startTransition(async () => {
      await task();
      setBusy(null);
    });
  }

  function changeQuantity(variantId: string, quantity: number) {
    run(`qty:${variantId}`, () => setCartQuantity(variantId, quantity));
  }

  function remove(variantId: string) {
    run(`remove:${variantId}`, () => removeFromCart(variantId));
  }

  function clear() {
    run("clear", () => clearCart());
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
      className={`grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_360px] ${pending ? "opacity-70" : ""}`}
    >
      <div className="space-y-6">
        {groups.map((group) => (
          <section key={group.farmerId || group.farmerName}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <FarmerAvatar name={group.farmerName} url={group.farmerAvatarUrl} />
                <h2 className="truncate text-sm font-semibold text-zinc-900">
                  {group.farmerName}
                </h2>
              </div>
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
                  key={item.variantId}
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
                        {item.sizeLabel ? (
                          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-200">
                            Ölçü: {item.sizeLabel}
                          </span>
                        ) : null}
                        <p className="mt-1 text-xs text-zinc-500">
                          {formatPrice(item.price)}
                          {formatUnit(item.unitType, item.unitSize)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item.variantId)}
                        disabled={pending}
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-500 hover:text-rose-600 disabled:opacity-60"
                      >
                        {busy === `remove:${item.variantId}` ? (
                          <Spinner className="h-3 w-3" />
                        ) : null}
                        Sil
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QuantityInput
                        variant="cart"
                        value={Number(item.quantity)}
                        unit={item.unitType}
                        min={item.minQuantity}
                        // Above the stock only when stock dropped after it
                        // was added; typing then brings it down to the stock.
                        max={Math.max(item.maxQuantity, item.minQuantity)}
                        onCommit={(quantity) => changeQuantity(item.variantId, quantity)}
                        disabled={pending}
                        label={`${item.title} miqdarı`}
                      />
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
                        {busy === `qty:${item.variantId}` ? (
                          <Spinner className="h-3.5 w-3.5 text-emerald-600" />
                        ) : null}
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>

                    {item.maxQuantity < item.minQuantity ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        Stokda qalmayıb — sifarişi tamamlamaq üçün bu məhsulu
                        səbətdən silin.
                      </p>
                    ) : item.quantity > item.maxQuantity ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        Yalnız {formatAmount(item.unitType, item.maxQuantity, item.unitSize)}{" "}
                        qalıb — miqdarı azaldın.
                      </p>
                    ) : item.quantity < item.minQuantity ? (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800 ring-1 ring-amber-200">
                        Minimum sifariş: {formatAmount(item.unitType, item.minQuantity, item.unitSize)} — miqdarı artırın.
                      </p>
                    ) : null}
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
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-rose-600 disabled:opacity-60"
        >
          {busy === "clear" ? <Spinner className="h-3.5 w-3.5" /> : null}
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
          {discount > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>Promokod endirimi</span>
              <span className="font-medium">−{formatPrice(discount)}</span>
            </div>
          ) : null}
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

        <div className="mt-5 border-t border-zinc-100 pt-5">
          <PromoCodeBox promo={promo} />
        </div>

        {hasStockIssue ? (
          <>
            <p className="mt-6 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Səbətdə stoku çatmayan məhsul var. Ödənişə keçməzdən əvvəl
              miqdarı azaldın və ya həmin məhsulu silin.
            </p>
            <span
              aria-disabled
              className="mt-3 inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 px-4 py-3 text-sm font-semibold text-zinc-500"
            >
              Ödə
            </span>
          </>
        ) : (
          <Link
            href="/checkout"
            prefetch
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            <LinkSpinner />
            Ödə
          </Link>
        )}
      </aside>
    </div>
  );
}
