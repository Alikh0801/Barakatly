import type { FarmerPayout } from "@/lib/farmer/queries";
import { formatDateTime } from "@/lib/format/date";
import { formatPrice } from "@/lib/shop/format";

/** The farmer's "Ödənişlərim": what Barakatly owes them and has paid. */
export function FarmerPayoutsList({ payouts }: { payouts: FarmerPayout[] }) {
  if (payouts.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
        Hələ ödəniş yoxdur.
      </p>
    );
  }

  const pending =
    payouts
      .filter((payout) => payout.status === "pending")
      .reduce((sum, payout) => sum + Math.round(payout.amount * 100), 0) / 100;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
        <span className="text-sm font-medium text-zinc-600">Gözləyən ödəniş</span>
        <span className="text-xl font-semibold text-zinc-900">{formatPrice(pending)}</span>
      </div>
      <ul className="divide-y divide-zinc-100 rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
        {payouts.map((payout) => (
          <li key={payout.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">{payout.order_code}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDateTime(payout.created_at)}
                {payout.card ? ` · Kart ${payout.card}` : " · Kart əlavə olunmayıb"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-zinc-900">{formatPrice(payout.amount)}</span>
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                  payout.status === "paid"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-amber-50 text-amber-800 ring-amber-200"
                }`}
              >
                {payout.status === "paid" ? "Ödənildi" : "Gözləyir"}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
