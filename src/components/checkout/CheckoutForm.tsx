"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { placeOrder, type PlaceOrderState } from "@/lib/checkout/actions";
import { DELIVERY_FEE } from "@/lib/checkout/constants";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import { useCartStore } from "@/store/cart";
import { useCartHydrated } from "@/hooks/useCartHydrated";
import { CheckoutSkeleton } from "@/components/skeletons";
import { Spinner } from "@/components/ui/Spinner";
import type { Bank } from "@/types";

const initialState: PlaceOrderState = {};

export function CheckoutForm({
  banks,
  defaultPhone,
}: {
  banks: Bank[];
  defaultPhone?: string | null;
}) {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal());
  const clearCart = useCartStore((s) => s.clearCart);
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);
  const cartPayload = JSON.stringify(
    items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  );

  useEffect(() => {
    if (state.orderId) {
      clearCart();
      router.replace(`/orders/${state.orderId}?success=1`);
    }
  }, [state.orderId, clearCart, router]);

  if (!hydrated) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Səbətiniz boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ödənişə keçmək üçün əvvəlcə məhsul əlavə edin.
        </p>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Bank siyahısı boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Supabase-də bank məlumatlarını yoxlayın.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <input type="hidden" name="cart_items" value={cartPayload} />

      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            Əlaqə və çatdırılma
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="contact_phone"
                className="block text-sm font-medium text-zinc-700"
              >
                Telefon *
              </label>
              <input
                id="contact_phone"
                name="contact_phone"
                type="tel"
                required
                defaultValue={defaultPhone ?? ""}
                placeholder="+994 50 000 00 00"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="delivery_address_text"
                className="block text-sm font-medium text-zinc-700"
              >
                Çatdırılma ünvanı
              </label>
              <textarea
                id="delivery_address_text"
                name="delivery_address_text"
                rows={3}
                placeholder="Küçə, bina, mənzil..."
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
              />
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Bank köçürməsi</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Aşağıdakı banklardan birinə köçürmə edin və çeki yükləyin.
          </p>
          <div className="mt-4 space-y-3">
            {banks.map((bank) => (
              <label
                key={bank.id}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 p-4 transition has-checked:border-emerald-500 has-checked:bg-emerald-50/50"
              >
                <input
                  type="radio"
                  name="bank_id"
                  value={bank.id}
                  required
                  className="mt-1 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-medium text-zinc-900">{bank.name}</div>
                  <div className="mt-1 font-mono text-sm text-zinc-600">
                    PAN: {bank.pan_number}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Ödəniş çeki</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Bank köçürməsinin ekran görüntüsünü və ya PDF çekini yükləyin (max 5
            MB).
          </p>
          <input
            id="receipt"
            name="receipt"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mt-4 block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </section>
      </div>

      <aside className="h-fit space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Sifariş xülasəsi</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900">{item.title}</div>
                  <div className="text-xs text-zinc-500">
                    {item.quantity} × {formatPrice(item.price)}
                    {formatUnit(item.unitType)}
                  </div>
                </div>
                <div className="shrink-0 font-medium text-zinc-900">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between text-zinc-700">
              <span>Məhsullar</span>
              <span className="font-medium text-zinc-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-700">
              <span>Çatdırılma</span>
              <span className="font-medium text-zinc-900">
                {formatPrice(DELIVERY_FEE)}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold text-zinc-900">
              <span>Cəmi</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {state.error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pending ? (
              <>
                <Spinner className="h-4 w-4" />
                Göndərilir...
              </>
            ) : (
              "Sifarişi təsdiqlə"
            )}
          </button>
        </div>
      </aside>
    </form>
  );
}
