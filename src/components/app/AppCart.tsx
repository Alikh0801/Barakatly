"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { MinusIcon, PlusIcon, ShoppingBagIcon, StoreIcon, TrashIcon } from "@/components/app/icons";
import { PromoCodeBox, groupByFarmer } from "@/components/cart/CartView";
import { Spinner } from "@/components/ui/Spinner";
import { removeFromCart, setCartQuantity } from "@/lib/cart/actions";
import type { CartLineItem } from "@/lib/cart/queries";
import { DELIVERY_FEE } from "@/lib/checkout/constants";
import type { AppliedPromo } from "@/lib/promo/constants";
import { formatPrice, unitLabel } from "@/lib/shop/format";
import { formatAmount, formatQuantity, normalizeQuantity, quantityHasUnit, quantityStep } from "@/lib/shop/quantity";

/**
 * The installed app's cart (Figma "cart" / "cart-empty"): lines grouped by
 * farmer with an amount stepper and a bin, the promo code, and a summary
 * with "Sifarişi tamamla" fixed at the bottom. Prices, stock checks, the
 * delivery fee and promo codes are the website's. App only.
 */

function amountText(item: CartLineItem): string {
  const amount = formatQuantity(item.unitType, item.quantity);
  if (quantityHasUnit(item.unitType)) return amount;
  const word = unitLabel(item.unitType);
  return word ? `${amount} ${word}` : amount;
}

function stockNote(item: CartLineItem): string | null {
  if (item.maxQuantity < item.minQuantity) return "Stokda qalmayıb — sifarişi tamamlamaq üçün bu məhsulu səbətdən silin.";
  if (item.quantity > item.maxQuantity) {
    return `Yalnız ${formatAmount(item.unitType, item.maxQuantity, item.unitSize)} qalıb — miqdarı azaldın.`;
  }
  if (item.quantity < item.minQuantity) {
    return `Minimum sifariş: ${formatAmount(item.unitType, item.minQuantity, item.unitSize)} — miqdarı artırın.`;
  }
  return null;
}

export function AppCartEmpty({ signedIn }: { signedIn: boolean }) {
  return (
    <div data-app-screen className="hidden min-h-dvh font-app text-app-ink app:block">
      <h1 className="px-6 pt-4 font-app-display text-[22px] font-bold">Səbətim</h1>
      <div className="px-6 py-16 text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3eee2] text-app-green">
          <ShoppingBagIcon className="h-9 w-9" />
        </span>
        <p className="mt-5 font-app-display text-xl font-bold">
          {signedIn ? "Səbətiniz boşdur" : "Səbətinizi görmək üçün daxil olun"}
        </p>
        <p className="mx-auto mt-2 max-w-xs text-sm text-app-muted">
          {signedIn
            ? "Mağazaya baxın və bəyəndiyiniz məhsulları səbətə əlavə edin."
            : "Səbətiniz hesabınıza bağlıdır — istənilən cihazdan daxil olub davam edə bilərsiniz."}
        </p>
        <Link
          href={signedIn ? "/shop" : "/signin?next=/cart"}
          className="mt-6 inline-flex h-12 items-center rounded-full bg-app-green px-7 text-sm font-bold text-white"
        >
          {signedIn ? "Mağazaya bax" : "Daxil ol"}
        </Link>
      </div>
    </div>
  );
}

export function AppCart({ items, promo }: { items: CartLineItem[]; promo: AppliedPromo | null }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const groups = useMemo(() => groupByFarmer(items), [items]);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = promo && !promo.error ? Math.min(promo.discount, subtotal) : 0;
  const total = subtotal - discount + DELIVERY_FEE;
  const hasStockIssue = items.some((item) => stockNote(item) !== null);

  function run(key: string, task: () => Promise<unknown>) {
    setBusy(key);
    startTransition(async () => {
      await task();
      setBusy(null);
    });
  }

  function step(item: CartLineItem, direction: 1 | -1) {
    // Half kilos for weight, as on the product screen.
    const size = item.unitType === "kg" ? 0.5 : quantityStep(item.unitType);
    const next = normalizeQuantity(item.unitType, item.quantity + direction * size, {
      min: item.minQuantity,
      max: Math.max(item.maxQuantity, item.minQuantity),
    });
    if (next > 0 && next !== item.quantity) run(`qty:${item.variantId}`, () => setCartQuantity(item.variantId, next));
  }

  return (
    // data-hide-tabbar: a full cart has its summary where the tab bar goes.
    <div data-app-screen data-hide-tabbar className="hidden min-h-dvh pb-64 font-app text-app-ink app:block">
      <h1 className="px-6 pt-4 font-app-display text-[22px] font-bold">Səbətim</h1>

      <div className="space-y-5 px-6 pt-5">
        {groups.map((group) => (
          <section key={group.farmerId || group.farmerName}>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-app-green">
              <StoreIcon className="h-[18px] w-[18px]" />
              <span className="truncate">{group.farmerName}</span>
            </h2>
            <ul className="mt-2.5 space-y-2.5">
              {group.items.map((item) => {
                const note = stockNote(item);
                const working = busy === `qty:${item.variantId}` || busy === `remove:${item.variantId}`;
                return (
                  <li key={item.variantId} className="rounded-2xl bg-white p-3">
                    <div className="flex gap-3">
                      <Link
                        href={`/shop/${item.productId}`}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f3eee2]"
                      >
                        {item.imageUrl ? (
                          <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">{item.title}</p>
                            {item.sizeLabel ? <p className="truncate text-xs text-app-muted">{item.sizeLabel}</p> : null}
                          </div>
                          <button
                            type="button"
                            data-static-hover
                            onClick={() => run(`remove:${item.variantId}`, () => removeFromCart(item.variantId))}
                            disabled={pending}
                            aria-label={`${item.title} səbətdən sil`}
                            className="-mt-1 -mr-1 shrink-0 p-1 text-app-muted disabled:opacity-50"
                          >
                            <TrashIcon className="h-[18px] w-[18px]" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate">
                            <span className="font-app-display text-base font-bold text-[#3b7a2c]">
                              {formatPrice(item.price * item.quantity)}
                            </span>{" "}
                            <span className="text-[11px] text-app-muted">({formatPrice(item.price)})</span>
                          </p>
                          <div className="flex shrink-0 items-center gap-2 rounded-full bg-[#f3eee2] px-1.5 py-1">
                            <button
                              type="button"
                              data-static-hover
                              onClick={() => step(item, -1)}
                              disabled={pending || item.quantity <= item.minQuantity + 1e-9}
                              aria-label="Azalt"
                              className="flex h-6 w-6 items-center justify-center disabled:opacity-35"
                            >
                              <MinusIcon className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[2.75rem] text-center text-xs font-bold">
                              {working ? <Spinner className="mx-auto h-3.5 w-3.5 text-app-green" /> : amountText(item)}
                            </span>
                            <button
                              type="button"
                              data-static-hover
                              onClick={() => step(item, 1)}
                              disabled={pending || item.quantity >= item.maxQuantity - 1e-9}
                              aria-label="Artır"
                              className="flex h-6 w-6 items-center justify-center disabled:opacity-35"
                            >
                              <PlusIcon className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {note ? <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{note}</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <div className="rounded-2xl bg-white p-4">
          <PromoCodeBox promo={promo} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white px-6 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(46,42,32,0.06)]">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between text-app-muted">
            <dt>Məhsullar</dt>
            <dd className="font-semibold text-app-ink">{formatPrice(subtotal)}</dd>
          </div>
          {discount > 0 ? (
            <div className="flex justify-between text-app-green">
              <dt>Promokod endirimi</dt>
              <dd className="font-semibold">−{formatPrice(discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-app-muted">
            <dt>Kuryer haqqı</dt>
            <dd className="font-semibold text-app-ink">{formatPrice(DELIVERY_FEE)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-app-line pt-3">
            <dt className="font-bold">Cəmi məbləğ</dt>
            <dd className="font-app-display text-xl font-bold text-[#3b7a2c]">{formatPrice(total)}</dd>
          </div>
        </dl>
        {hasStockIssue ? (
          <p className="mt-4 flex h-14 items-center justify-center rounded-full bg-[#f3eee2] px-4 text-center text-sm font-semibold text-app-muted">
            Sifariş üçün stok problemlərini düzəldin
          </p>
        ) : (
          <Link
            href="/checkout"
            className="mt-4 flex h-14 items-center justify-center rounded-full bg-app-green text-base font-bold text-white"
          >
            Sifarişi tamamla • {formatPrice(total)}
          </Link>
        )}
      </div>
    </div>
  );
}
