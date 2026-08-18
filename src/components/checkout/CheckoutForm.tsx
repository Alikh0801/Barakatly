"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { placeOrder, type PlaceOrderState } from "@/lib/checkout/actions";
import { DELIVERY_FEE } from "@/lib/checkout/constants";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import type { CartLineItem } from "@/lib/cart/queries";
import { AzPhoneInput } from "@/components/ui/AzPhoneInput";
import { Spinner } from "@/components/ui/Spinner";
import type { Bank } from "@/types";

const initialState: PlaceOrderState = {};

/** Shows only the first and last groups of a hyphenated PAN, e.g. "1234 •••• •••• 5678". */
function maskPan(pan: string): string {
  const groups = pan.split("-").filter(Boolean);
  if (groups.length < 3) {
    const digits = pan.replace(/\D/g, "");
    if (digits.length <= 8) return pan;
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }
  return groups
    .map((group, index) =>
      index === 0 || index === groups.length - 1
        ? group
        : "•".repeat(group.length),
    )
    .join(" ");
}

function BankOption({ bank }: { bank: Bank }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(event: React.MouseEvent) {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(bank.pan_number.replace(/\D/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — nothing safe to fall back to.
    }
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 p-4 transition has-checked:border-emerald-500 has-checked:bg-emerald-50/50">
      <input
        type="radio"
        name="bank_id"
        value={bank.id}
        required
        className="mt-1 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-zinc-900">{bank.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm tracking-wider text-zinc-700">
            {maskPan(bank.pan_number)}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {copied ? "Kopyalandı ✓" : "Kartı kopyala"}
          </button>
        </div>
      </div>
    </label>
  );
}

export function CheckoutForm({
  banks,
  defaultPhone,
  items,
}: {
  banks: Bank[];
  defaultPhone?: string | null;
  items: CartLineItem[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  useEffect(() => {
    if (state.orderId) {
      router.replace(`/orders/${state.orderId}?success=1`);
    }
  }, [state.orderId, router]);

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
      <div className="space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">
            Əlaqə və çatdırılma
          </h2>
          <div className="mt-4 space-y-4">
            <AzPhoneInput
              id="contact_phone"
              name="contact_phone"
              label="Telefon"
              required
              defaultValue={defaultPhone ?? ""}
            />
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
              <BankOption key={bank.id} bank={bank} />
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
