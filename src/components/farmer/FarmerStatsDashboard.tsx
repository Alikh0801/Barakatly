"use client";

import { useActionState, useState } from "react";
import { updateOrderItemStatus } from "@/lib/farmer/actions";
import type { FarmerOrderItem } from "@/lib/farmer/queries";
import type { FarmerSalesStats } from "@/lib/farmer/stats";
import type { FarmerRatingSummary } from "@/lib/farmers/queries";
import { formatDate } from "@/lib/format/date";
import { unitLabel } from "@/lib/shop/format";
import { Spinner } from "@/components/ui/Spinner";
import { CancelOrderItemForm } from "@/components/farmer/CancelOrderItemForm";

const MONTH_NAMES = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const MONTH_SHORT = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

const PENDING_LIMIT = 5;

/**
 * Numbers are formatted by hand: Node and browsers disagree on the "az-AZ"
 * separators (1.306,80 vs 1,306.80), which broke hydration. Decimals use a
 * point like prices elsewhere on the site, thousands a non-breaking space.
 */
function groupThousands(value: string) {
  const [whole, fraction] = value.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

const whole = (value: number) => groupThousands(String(Math.round(value)));
const money = (value: number) => `${groupThousands(value.toFixed(2))} ₼`;

function monthIndex(key: string) {
  return Number(key.split("-")[1]) - 1;
}

/** A round top for the value axis, so its ticks read as plain numbers. */
function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function axisMoney(value: number) {
  if (value >= 10_000) return `${whole(value / 1000)}k`;
  return whole(value);
}

function relativeTime(value: string, now: number) {
  const minutes = Math.floor((now - new Date(value).getTime()) / 60_000);
  if (minutes < 1) return "indicə";
  if (minutes < 60) return `${minutes} dəq əvvəl`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat əvvəl`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün əvvəl`;
  return formatDate(value);
}

function formatQuantity(quantity: number) {
  return String(Math.round(quantity * 1000) / 1000);
}

// ---------------------------------------------------------------------------
// KPI cards
// ---------------------------------------------------------------------------

function Change({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) return null;
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(change));
  const up = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
      }`}
    >
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`h-3 w-3 ${up ? "" : "rotate-180"}`}>
        <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="sr-only">{up ? "artım" : "azalma"}</span>
      {rounded}%
    </span>
  );
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  badge,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: string;
  badge?: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          {icon}
        </span>
        {badge}
      </div>
      <p className="mt-4 truncate text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

const iconClass = "h-5 w-5";

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={iconClass}>
      <rect x="3" y="6" width="18" height="14" rx="2.5" />
      <path d="M3 10h18M16 15h2" strokeLinecap="round" />
      <path d="M6 6V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={iconClass}>
      <path d="M5 8h14l-1 12H6L5 8Z" strokeLinejoin="round" />
      <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeLinecap="round" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={iconClass}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" strokeLinejoin="round" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={iconClass}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Revenue chart
// ---------------------------------------------------------------------------

/**
 * Monthly revenue as a single-series area chart. The line and fill are an
 * SVG stretched to the box; the dots, hover zones and tooltips are HTML on
 * top so they keep their shape at any width. The same numbers sit in a
 * screen-reader table.
 */
function RevenueChart({ months }: { months: FarmerSalesStats["months"] }) {
  const top = niceMax(Math.max(0, ...months.map((m) => m.revenue)));
  const ticks = [top, top / 2, 0];
  const count = months.length;
  const x = (index: number) => (count === 1 ? 50 : (index / (count - 1)) * 100);
  const y = (value: number) => 100 - (value / top) * 100;

  const points = months.map((m, index) => `${x(index)},${y(m.revenue)}`);
  const line = `M${points.join(" L")}`;
  const area = `${line} L100,100 L0,100 Z`;
  const empty = months.every((m) => m.revenue === 0);

  return (
    // Grows with its card, so the chart fills the height the pending list sets.
    <figure className="flex flex-1 flex-col">
      <div className="flex min-h-52 flex-1 gap-2">
        <div className="flex w-9 shrink-0 flex-col justify-between text-right text-[11px] leading-none text-zinc-400" aria-hidden="true">
          {ticks.map((tick) => (
            <span key={tick}>{axisMoney(tick)}</span>
          ))}
        </div>
        {/* Side padding keeps the first and last dots inside the box. */}
        <div className="relative min-w-0 flex-1 px-2" role="img" aria-label="Son aylar üzrə gəlir">
            {ticks.map((tick, index) => (
              <div
                key={tick}
                aria-hidden="true"
                className={`absolute inset-x-0 border-t ${index === ticks.length - 1 ? "border-zinc-300" : "border-dashed border-zinc-200"}`}
                style={{ top: `${(index / (ticks.length - 1)) * 100}%` }}
              />
            ))}
            <div className="absolute inset-y-0 left-2 right-2">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-0 h-full w-full overflow-visible">
                <defs>
                  <linearGradient id="farmer-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2f7a3c" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#2f7a3c" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={area} fill="url(#farmer-revenue-fill)" />
                <path d={line} fill="none" stroke="#2f7a3c" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>

              {months.map((m, index) => {
                const label = `${MONTH_NAMES[monthIndex(m.month)]}: ${money(m.revenue)}, ${m.orders} sifariş`;
                const align =
                  index === 0 ? "left-0" : index === count - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
                return (
                  <div
                    key={m.month}
                    tabIndex={0}
                    aria-label={label}
                    className="group absolute inset-y-0 outline-none"
                    style={{
                      left: `${x(index) - 50 / Math.max(count - 1, 1)}%`,
                      width: `${100 / Math.max(count - 1, 1)}%`,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#2f7a3c] shadow ring-1 ring-[#2f7a3c]/30 transition-transform group-hover:scale-125 group-focus:scale-125"
                      style={{ top: `${y(m.revenue)}%` }}
                    />
                    <span
                      aria-hidden="true"
                      className="absolute left-1/2 hidden h-full border-l border-dashed border-zinc-300 group-hover:block group-focus:block"
                    />
                    <div
                      className={`pointer-events-none absolute z-10 hidden whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs text-white shadow-lg group-hover:block group-focus:block ${align}`}
                      style={{ bottom: `calc(${100 - y(m.revenue)}% + 12px)` }}
                    >
                      <span className="font-semibold">{money(m.revenue)}</span>
                      <span className="text-zinc-300"> · {m.orders} sifariş</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {empty ? (
              <p className="absolute inset-x-0 top-1/3 text-center text-sm text-zinc-500">
                Bu dövrdə hələ satış olmayıb.
              </p>
            ) : null}
        </div>
      </div>
      <div className="relative ml-11 mt-2 h-4 px-2 text-[11px] text-zinc-500" aria-hidden="true">
        <div className="absolute inset-y-0 left-2 right-2">
          {months.map((m, index) => (
            <span
              key={m.month}
              className="absolute -translate-x-1/2 whitespace-nowrap"
              style={{ left: `${x(index)}%` }}
            >
              {MONTH_SHORT[monthIndex(m.month)]}
            </span>
          ))}
        </div>
      </div>
      <table className="sr-only">
        <caption>Aylar üzrə gəlir</caption>
        <tbody>
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row">{MONTH_NAMES[monthIndex(m.month)]} {m.month.slice(0, 4)}</th>
              <td>{money(m.revenue)}</td>
              <td>{m.orders} sifariş</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Pending orders
// ---------------------------------------------------------------------------

function PendingOrderRow({ item, now }: { item: FarmerOrderItem; now: number }) {
  const [state, action, pending] = useActionState(updateOrderItemStatus, {});
  const [cancelling, setCancelling] = useState(false);
  const order = item.orders;
  const unit = unitLabel(item.unit_type, item.unit_size);

  return (
    <li className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {order?.order_code ?? "Sifariş"}
            {order?.customer?.full_name ? (
              <span className="font-normal text-zinc-500"> · {order.customer.full_name}</span>
            ) : null}
          </p>
          <p className="mt-0.5 truncate text-sm text-zinc-600">
            {item.product_title} · {formatQuantity(Number(item.quantity))}
            {unit ? ` ${unit}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-zinc-900">{money(Number(item.line_total))}</p>
          <p className="mt-0.5 text-xs text-zinc-500" suppressHydrationWarning>
            {relativeTime(item.created_at, now)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCancelling((open) => !open)}
          disabled={pending}
          aria-label={`${item.product_title} sifarişini ləğv et`}
          aria-expanded={cancelling}
          title="Ləğv et"
          data-static-hover
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 transition-colors disabled:opacity-60 ${
            cancelling
              ? "bg-rose-600 text-white ring-rose-600"
              : "bg-rose-50 text-rose-600 ring-rose-200 hover:bg-rose-600 hover:text-white"
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-4 w-4">
            <path d="M7 7l10 10M17 7 7 17" strokeLinecap="round" />
          </svg>
        </button>
        <form action={action} className="shrink-0">
          <input type="hidden" name="order_item_id" value={item.id} />
          <input type="hidden" name="next_status" value="accepted" />
          <button
            type="submit"
            disabled={pending}
            aria-label={`${item.product_title} sifarişini qəbul et`}
            title="Qəbul et"
            data-static-hover
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-600 hover:text-white disabled:opacity-60"
          >
            {pending ? (
              <Spinner className="h-4 w-4" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-4 w-4">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </form>
      </div>
      {state.error ? (
        <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700">{state.error}</p>
      ) : null}
      {cancelling ? (
        <CancelOrderItemForm
          itemId={item.id}
          productTitle={item.product_title}
          onClose={() => setCancelling(false)}
        />
      ) : null}
    </li>
  );
}

function PendingOrders({
  items,
  onViewAll,
}: {
  items: FarmerOrderItem[];
  onViewAll: () => void;
}) {
  // eslint-disable-next-line react-hooks/purity -- "N min ago" is meant to read the clock.
  const now = Date.now();
  const shown = items.slice(0, PENDING_LIMIT);

  return (
    <section className="flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-900">Gözləyən sifarişlər</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            {items.length > 0 ? `${items.length} məhsul təsdiqinizi gözləyir` : "Qəbul olunmalı sifariş yoxdur"}
          </p>
        </div>
        {items.length > 0 ? (
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-100 px-2 text-sm font-semibold text-amber-800">
            {items.length}
          </span>
        ) : null}
      </div>

      {shown.length > 0 ? (
        <ul className="mt-4 divide-y divide-zinc-100">
          {shown.map((item) => (
            <PendingOrderRow key={item.id} item={item} now={now} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-6 w-6">
              <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="mt-3 text-sm text-zinc-600">Yeni sifariş gələndə burada görünəcək.</p>
        </div>
      )}

      <button
        type="button"
        onClick={onViewAll}
        data-static-hover
        className="mt-4 inline-flex items-center justify-center gap-1 self-center rounded-full px-3 py-1.5 text-sm font-semibold text-[#2f7a3c] hover:bg-emerald-50"
      >
        Bütün sifarişlərə bax
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
          <path d="m7.5 5 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type FarmerProductCounts = {
  approved: number;
  newThisMonth: number;
  inReview: number;
};

export function FarmerStatsDashboard({
  sales,
  rating,
  products,
  orders,
  onViewOrders,
}: {
  sales: FarmerSalesStats;
  rating: FarmerRatingSummary;
  products: FarmerProductCounts;
  orders: FarmerOrderItem[];
  onViewOrders: () => void;
}) {
  const pending = orders.filter(
    (item) => item.status === "new" && item.orders?.status !== "cancelled",
  );
  const sixMonthRevenue = sales.months.reduce((sum, m) => sum + m.revenue, 0);
  const firstMonth = sales.months[0];
  const lastMonth = sales.months[sales.months.length - 1];

  const productHint =
    products.newThisMonth > 0
      ? `Bu ay +${products.newThisMonth} yeni`
      : products.inReview > 0
        ? `${products.inReview} məhsul yoxlamada`
        : "Satışda olan məhsullar";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          label="Bu ayın gəliri"
          value={money(sales.revenue)}
          icon={<WalletIcon />}
          tone="bg-emerald-50 text-emerald-700"
          badge={<Change current={sales.revenue} previous={sales.previousRevenue} />}
          hint={`Keçən ay bu vaxt: ${money(sales.previousRevenue)}`}
        />
        <KpiCard
          label="Bu ayın sifarişləri"
          value={whole(sales.orders)}
          icon={<BagIcon />}
          tone="bg-sky-50 text-sky-700"
          badge={<Change current={sales.orders} previous={sales.previousOrders} />}
          hint={`Keçən ay bu vaxt: ${whole(sales.previousOrders)}`}
        />
        <KpiCard
          label="Məhsullar"
          value={whole(products.approved)}
          icon={<BoxIcon />}
          tone="bg-violet-50 text-violet-700"
          badge={
            products.newThisMonth > 0 ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700">
                +{products.newThisMonth}
              </span>
            ) : null
          }
          hint={productHint}
        />
        <KpiCard
          label="Orta reytinq"
          value={rating.average === null ? "—" : rating.average.toFixed(1).replace(".", ",")}
          icon={<StarIcon />}
          tone="bg-amber-50 text-amber-600"
          hint={rating.total > 0 ? `${rating.total} rəy əsasında` : "Hələ rəy yoxdur"}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="flex min-w-0 flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900">Gəlir icmalı</h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {firstMonth && lastMonth
                  ? `${MONTH_NAMES[monthIndex(firstMonth.month)]} – ${MONTH_NAMES[monthIndex(lastMonth.month)]}, aylar üzrə`
                  : "Aylar üzrə"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-zinc-900">{money(sixMonthRevenue)}</p>
              <p className="text-xs text-zinc-500">son {sales.months.length} ayda</p>
            </div>
          </div>
          <div className="mt-5 flex flex-1 flex-col">
            <RevenueChart months={sales.months} />
          </div>
        </section>

        <PendingOrders items={pending} onViewAll={onViewOrders} />
      </div>

      <p className="text-xs text-zinc-500">
        Gəlirə ödənişi təsdiqlənmiş, ləğv olunmamış sifarişlərdəki öz məhsullarınızın məbləği daxildir.
      </p>
    </div>
  );
}
