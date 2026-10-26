"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  markPayoutPaid,
  revertPayout,
  saveFarmerPayoutAccount,
  type PayoutActionState,
} from "@/lib/admin/payout-actions";
import type { AdminPayout, PayoutDebt, PayoutFilter } from "@/lib/admin/payout-queries";
import { formatPanDisplay } from "@/lib/admin/bank-format";
import { farmerDisplayName } from "@/lib/farmers/name";
import { formatDateTime } from "@/lib/format/date";
import { formatPrice } from "@/lib/shop/format";
import { formatAmount } from "@/lib/shop/quantity";
import { Spinner } from "@/components/ui/Spinner";

const initialState: PayoutActionState = {};

const TABS: { id: PayoutFilter; label: string }[] = [
  { id: "pending", label: "Gözləyir" },
  { id: "paid", label: "Ödənildi" },
  { id: "all", label: "Hamısı" },
];

function payoutsHref(filter: PayoutFilter, farmerId: string | null) {
  const params = new URLSearchParams();
  if (filter !== "pending") params.set("status", filter);
  if (farmerId) params.set("farmer", farmerId);
  const query = params.toString();
  return `/admin/payouts${query ? `?${query}` : ""}`;
}

function ActionMessage({ state }: { state: PayoutActionState }) {
  if (state.error) {
    return (
      <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
        {state.success}
      </p>
    );
  }
  return null;
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Kart nömrəsini kopyalayın:", value);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="inline-flex h-8 shrink-0 items-center rounded-full bg-white px-3 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
    >
      {copied ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

function AccountForm({ farmerId }: { farmerId: string }) {
  const [state, action, pending] = useActionState(saveFarmerPayoutAccount, initialState);
  const [pan, setPan] = useState("");

  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="farmer_id" value={farmerId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="bank_name"
          required
          maxLength={60}
          placeholder="Bank"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 sm:w-40 sm:text-sm"
        />
        <input
          name="pan_number"
          required
          inputMode="numeric"
          autoComplete="off"
          placeholder="0000 0000 0000 0000"
          value={pan}
          onChange={(event) => setPan(formatPanDisplay(event.target.value))}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-base text-zinc-900 sm:w-52 sm:text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Kartı saxla
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

function PayoutCard({ payout }: { payout: AdminPayout }) {
  const [paidState, paidAction, paidPending] = useActionState(markPayoutPaid, initialState);
  const [revertState, revertAction, revertPending] = useActionState(revertPayout, initialState);
  const [lastAction, setLastAction] = useState<"paid" | "revert">("paid");
  const digits = (payout.pan_number ?? "").replace(/\D/g, "");
  const isPaid = payout.status === "paid";

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-zinc-900">
            {farmerDisplayName(payout.farmer_name)}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500">
            <Link
              href={`/admin/orders#order-${payout.order_id}`}
              className="font-medium text-emerald-700 hover:underline"
            >
              {payout.order_code}
            </Link>
            {" · "}
            {formatDateTime(payout.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:flex-col sm:items-end">
          <span className="text-xl font-semibold text-zinc-900">{formatPrice(payout.amount)}</span>
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
              isPaid
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-amber-50 text-amber-800 ring-amber-200"
            }`}
          >
            {isPaid ? "Ödənildi" : "Gözləyir"}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-100">
        {digits ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="text-sm text-zinc-600">{payout.bank_name || "Bank"}</span>
            <span className="font-mono text-base font-semibold tracking-wide text-zinc-900">
              {formatPanDisplay(digits)}
            </span>
            <CopyButton value={digits} />
          </div>
        ) : (
          <div>
            <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
              Kart yoxdur
            </span>
            <AccountForm farmerId={payout.farmer_id} />
          </div>
        )}
      </div>

      <details className="mt-3 rounded-xl ring-1 ring-zinc-100">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-zinc-800">
          Məhsullar ({payout.items.length})
        </summary>
        <div className="overflow-x-auto px-3 pb-3">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500">
                <th className="py-1.5 pr-3 font-medium">Məhsul</th>
                <th className="py-1.5 pr-3 font-medium">Miqdar</th>
                <th className="py-1.5 pr-3 text-right font-medium">Fermer qiyməti</th>
                <th className="py-1.5 text-right font-medium">Cəm</th>
              </tr>
            </thead>
            <tbody>
              {payout.items.map((item, index) => (
                <tr key={index} className="border-t border-zinc-100">
                  <td className="py-1.5 pr-3 text-zinc-900">{item.product_title}</td>
                  <td className="py-1.5 pr-3 text-zinc-700">
                    {formatAmount(item.unit_type, item.quantity, item.unit_size)}
                  </td>
                  <td className="py-1.5 pr-3 text-right text-zinc-700">
                    {formatPrice(item.farmer_unit_price)}
                  </td>
                  <td className="py-1.5 text-right font-medium text-zinc-900">
                    {formatPrice(item.line_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-3 space-y-2">
        {isPaid ? (
          <>
            <p className="text-sm text-zinc-600">
              Ödənildi: {payout.paid_at ? formatDateTime(payout.paid_at) : "—"}
              {payout.note ? ` · ${payout.note}` : ""}
            </p>
            <form action={revertAction} onSubmit={() => setLastAction("revert")}>
              <input type="hidden" name="payout_id" value={payout.id} />
              <button
                type="submit"
                disabled={revertPending}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-70"
              >
                {revertPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                Geri qaytar
              </button>
            </form>
          </>
        ) : (
          <form
            action={paidAction}
            onSubmit={() => setLastAction("paid")}
            className="flex flex-col gap-2 sm:flex-row"
          >
            <input type="hidden" name="payout_id" value={payout.id} />
            <input
              name="note"
              maxLength={300}
              placeholder="Qeyd (istəyə görə)"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 sm:flex-1 sm:text-sm"
            />
            <button
              type="submit"
              disabled={paidPending}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
            >
              {paidPending ? <Spinner className="h-3.5 w-3.5" /> : null}
              Ödənildi
            </button>
          </form>
        )}
        <ActionMessage state={lastAction === "paid" ? paidState : revertState} />
      </div>
    </article>
  );
}

export function AdminPayoutsPanel({
  payouts,
  debts,
  farmers,
  filter,
  farmerId,
}: {
  payouts: AdminPayout[];
  debts: PayoutDebt[];
  farmers: { id: string; name: string | null }[];
  filter: PayoutFilter;
  farmerId: string | null;
}) {
  const router = useRouter();
  const total = debts.reduce((sum, debt) => sum + Math.round(debt.amount * 100), 0) / 100;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900">Borcumuz</h2>
          <span className="text-xl font-semibold text-zinc-900">{formatPrice(total)}</span>
        </div>
        {debts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">Gözləyən ödəniş yoxdur.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {debts.map((debt) => (
              <li key={debt.farmer_id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <Link
                  href={payoutsHref("pending", debt.farmer_id)}
                  className="min-w-0 truncate text-zinc-800 hover:text-emerald-700"
                >
                  {farmerDisplayName(debt.farmer_name)}
                  <span className="ml-1.5 text-zinc-400">({debt.count})</span>
                </Link>
                <span className="shrink-0 font-semibold text-zinc-900">{formatPrice(debt.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="inline-flex w-fit rounded-full bg-white p-1 shadow-sm ring-1 ring-zinc-200">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={payoutsHref(tab.id, farmerId)}
              aria-current={filter === tab.id ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === tab.id ? "bg-emerald-600 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
        <select
          aria-label="Fermer"
          value={farmerId ?? ""}
          onChange={(event) => router.push(payoutsHref(filter, event.target.value || null))}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-base text-zinc-900 sm:w-64 sm:text-sm"
        >
          <option value="">Bütün fermerlər</option>
          {farmers.map((farmer) => (
            <option key={farmer.id} value={farmer.id}>
              {farmerDisplayName(farmer.name)}
            </option>
          ))}
        </select>
      </div>

      {payouts.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
          Ödəniş yoxdur.
        </p>
      ) : (
        <div className="space-y-4">
          {payouts.map((payout) => (
            <PayoutCard key={payout.id} payout={payout} />
          ))}
        </div>
      )}
    </div>
  );
}
