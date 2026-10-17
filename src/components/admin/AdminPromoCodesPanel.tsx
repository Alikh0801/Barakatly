"use client";

import { useActionState, useState, useTransition } from "react";
import {
  deletePromoCode,
  savePromoCode,
  setPromoCodeActive,
  type AdminPromoActionState,
} from "@/lib/admin/promo-actions";
import type { AdminPromoCode, PromoCodeStatus } from "@/lib/admin/promo-queries";
import { formatDate } from "@/lib/format/date";
import { formatPrice } from "@/lib/shop/format";
import { Spinner } from "@/components/ui/Spinner";

const initialState: AdminPromoActionState = {};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm";

const STATUS: Record<PromoCodeStatus, { label: string; tone: string }> = {
  active: { label: "Aktiv", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  inactive: { label: "Deaktiv", tone: "bg-zinc-100 text-zinc-600 ring-zinc-200" },
  expired: { label: "Vaxtı bitib", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
  used_up: { label: "Limit dolub", tone: "bg-amber-50 text-amber-800 ring-amber-200" },
};

/** "2026-12-31T19:59:59Z" -> "2026-12-31", the day it ends in Baku. */
function bakuDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 4 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function discountLabel(promo: Pick<AdminPromoCode, "discount_type" | "discount_value">) {
  return promo.discount_type === "percent"
    ? `${Number(promo.discount_value)}%`
    : formatPrice(Number(promo.discount_value));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

/** Create form, or the edit form of `promo`. */
function PromoForm({ promo, onCancel }: { promo?: AdminPromoCode; onCancel?: () => void }) {
  const [state, action, pending] = useActionState(savePromoCode, initialState);
  const [type, setType] = useState<"percent" | "fixed">(promo?.discount_type ?? "percent");

  return (
    // A new form after each successful create, so the fields start empty.
    <form key={promo ? promo.id : (state.success ?? "new")} action={action} className="space-y-4">
      {promo ? <input type="hidden" name="id" value={promo.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kod">
          <input
            name="code"
            required
            maxLength={30}
            defaultValue={promo?.code}
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="YAY10"
            className={`${inputClass} uppercase placeholder:normal-case`}
          />
        </Field>
        <Field label="Ad">
          <input name="name" required maxLength={80} defaultValue={promo?.name} placeholder="Yay endirimi" className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-zinc-600">Endirim növü</span>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["percent", "Faiz (%)"],
                ["fixed", "Məbləğ (₼)"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm font-medium text-zinc-700 has-checked:border-emerald-500 has-checked:bg-emerald-50 has-checked:text-emerald-800"
              >
                <input
                  type="radio"
                  name="discount_type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <Field
          label={type === "percent" ? "Endirim faizi" : "Endirim məbləği (₼)"}
        >
          <input
            name="discount_value"
            required
            inputMode="decimal"
            defaultValue={promo ? String(promo.discount_value) : ""}
            placeholder={type === "percent" ? "10" : "5"}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Son istifadə tarixi">
          <input type="date" name="expires_on" defaultValue={bakuDate(promo?.expires_at ?? null)} className={inputClass} />
        </Field>
        <Field label="Minimum sifariş (₼)">
          <input
            name="min_order_amount"
            inputMode="decimal"
            defaultValue={promo && promo.min_order_amount > 0 ? String(promo.min_order_amount) : ""}
            placeholder="0"
            className={inputClass}
          />
        </Field>
        <Field label="Ümumi istifadə limiti">
          <input
            name="max_uses"
            inputMode="numeric"
            defaultValue={promo?.max_uses ? String(promo.max_uses) : ""}
            placeholder="Limitsiz"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="once_per_customer"
            defaultChecked={promo?.once_per_customer ?? true}
            className="h-4 w-4 rounded border-zinc-300 accent-emerald-600"
          />
          Hər müştəri yalnız bir dəfə istifadə edə bilər
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={promo?.is_active ?? true}
            className="h-4 w-4 rounded border-zinc-300 accent-emerald-600"
          />
          Aktiv
        </label>
      </div>

      {state.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p> : null}
      {state.success ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          {promo ? "Yadda saxla" : "Promokod yarat"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200"
          >
            Bağla
          </button>
        ) : null}
      </div>
    </form>
  );
}

function PromoCard({ promo }: { promo: AdminPromoCode }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const status = STATUS[promo.status];

  function run(task: () => Promise<AdminPromoActionState>) {
    setError("");
    startTransition(async () => {
      const result = await task();
      if (result.error) setError(result.error);
    });
  }

  const details = [
    promo.expires_at ? `Son tarix: ${formatDate(promo.expires_at)}` : "Müddətsiz",
    promo.min_order_amount > 0 ? `Min. sifariş: ${formatPrice(promo.min_order_amount)}` : null,
    promo.max_uses ? `${promo.uses} / ${promo.max_uses} istifadə` : `${promo.uses} istifadə`,
    promo.once_per_customer ? "Müştəri başına 1 dəfə" : "Təkrar istifadə olunur",
  ].filter(Boolean);

  return (
    <li className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5 ${pending ? "opacity-70" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-zinc-900 px-2.5 py-1 font-mono text-sm font-semibold tracking-wide text-white">
              {promo.code}
            </span>
            <span className="text-lg font-semibold text-emerald-700">−{discountLabel(promo)}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${status.tone}`}>{status.label}</span>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium text-zinc-800">{promo.name}</p>
          <p className="mt-1 text-xs text-zinc-500">{details.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditing((value) => !value)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            {editing ? "Bağla" : "Redaktə"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => setPromoCodeActive(promo.id, !promo.is_active))}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            {promo.is_active ? "Deaktiv et" : "Aktiv et"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(`"${promo.code}" promokodu silinsin? İstifadə olunmuş sifarişlərdə endirim qalır.`)) {
                run(() => deletePromoCode(promo.id));
              }
            }}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
          >
            Sil
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
      {editing ? (
        <div className="mt-4 border-t border-zinc-100 pt-4">
          <PromoForm promo={promo} onCancel={() => setEditing(false)} />
        </div>
      ) : null}
    </li>
  );
}

export function AdminPromoCodesPanel({ promoCodes }: { promoCodes: AdminPromoCode[] }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Yeni promokod</h2>
        <div className="mt-5">
          <PromoForm />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-zinc-900">Promokodlar ({promoCodes.length})</h2>
        {promoCodes.length === 0 ? (
          <p className="mt-3 rounded-2xl bg-white px-4 py-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
            Hələ promokod yaradılmayıb.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {promoCodes.map((promo) => (
              <PromoCard key={promo.id} promo={promo} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
