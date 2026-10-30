"use client";

import { useActionState, useDeferredValue, useEffect, useState } from "react";
import {
  advanceOrderStatus,
  announceItemCancellation,
  confirmPayment,
  deleteOrders,
  rejectPayment,
} from "@/lib/admin/actions";
import { markFarmerOrderUpdatesSeen } from "@/lib/admin/farmer-update-actions";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { formatPrice } from "@/lib/shop/format";
import { formatDateTime } from "@/lib/format/date";
import { DeliveryDate } from "@/components/orders/DeliveryDate";
import {
  ADMIN_STATUS_TRANSITIONS,
  ORDER_STATUS_FLOW,
  getOrderItemStatusLabel,
  getOrderStatusLabel,
  getPaymentBadgeTone,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { firstPayment } from "@/lib/orders/payment";
import { adminCanSetStatus, statusFromLines, statusOwner } from "@/lib/orders/admin-status";
import { deliveryAddress, recipientName } from "@/lib/orders/delivery";
import { ITEM_CANCEL_ANNOUNCED } from "@/lib/orders/item-cancel";
import { matchesAdminOrderQuery } from "@/lib/orders/admin-order-filter";
import type {
  AdminOrderItem,
  AdminOrderListItem,
  AdminPendingPayment,
  FarmerOrderUpdate,
} from "@/lib/admin/queries";
import type { OrderItemStatus, OrderStatus } from "@/types";
import { formatAmount } from "@/lib/shop/quantity";
import { farmerDisplayName } from "@/lib/farmers/name";

type ActionResult = { error?: string; success?: string };

const initialState: ActionResult = {};

function ReasonInput({ id }: { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Səbəb
      </label>
      <input
        id={id}
        name="reason"
        type="text"
        required
        placeholder="Səbəbi qeyd edin..."
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
      />
    </div>
  );
}

type PendingPaymentWithReceipt = AdminPendingPayment & {
  receiptSignedUrl?: string | null;
};

function PendingPaymentCard({ payment }: { payment: PendingPaymentWithReceipt }) {
  const [confirmState, confirmAction, confirmPending] = useActionState(
    confirmPayment,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectPayment,
    initialState
  );

  const order = payment.orders;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      {(confirmState.error || rejectState.error) && (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {confirmState.error ?? rejectState.error}
        </p>
      )}
      {(confirmState.success || rejectState.success) && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {confirmState.success ?? rejectState.success}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="font-semibold text-zinc-900">
            {order?.order_code ?? "Sifariş"}
          </div>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {formatDateTime(order?.created_at ?? payment.created_at)}
          </p>
          <p className="mt-2 break-all text-sm text-zinc-700">
            {payment.banks?.name ?? "Bank"} · {payment.banks?.pan_number}
          </p>
          {order?.contact_phone ? (
            <p className="mt-1 text-sm text-zinc-600">{order.contact_phone}</p>
          ) : null}
        </div>
        <div className="shrink-0 sm:text-right">
          <div className="font-semibold text-zinc-900">
            {order ? formatPrice(order.total_amount) : "—"}
          </div>
          {order?.promo_code && Number(order.discount_amount) > 0 ? (
            <div className="mt-0.5 text-xs text-emerald-700">
              {order.promo_code} · −{formatPrice(Number(order.discount_amount))}
            </div>
          ) : null}
          <div className="mt-2 text-xs font-medium text-amber-800">
            {getPaymentStatusLabel(payment.status)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {payment.receiptSignedUrl ? (
          <a
            href={payment.receiptSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200 sm:w-auto"
          >
            Çeki aç
          </a>
        ) : null}
        <form action={confirmAction} className="w-full sm:w-auto">
          <input type="hidden" name="payment_id" value={payment.id} />
          <button
            type="submit"
            disabled={confirmPending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 sm:w-auto"
          >
            {confirmPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Təsdiqlə
          </button>
        </form>
        <form action={rejectAction} className="flex w-full flex-col gap-2 sm:w-64">
          <input type="hidden" name="payment_id" value={payment.id} />
          <ReasonInput id={`payment-reject-reason-${payment.id}`} />
          <button
            type="submit"
            disabled={confirmPending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-70"
          >
            {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Rədd et
          </button>
        </form>
      </div>
    </article>
  );
}

export function PendingPaymentsPanel({
  payments,
}: {
  payments: PendingPaymentWithReceipt[];
}) {
  if (payments.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Gözləyən ödəniş yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <PendingPaymentCard key={payment.id} payment={payment} />
      ))}
    </div>
  );
}

type AdminOrderListItemWithReceipt = AdminOrderListItem & {
  receiptSignedUrl?: string | null;
};

/**
 * A farmer's cancellation reaches the customer only through the admin: this
 * sends it, or says it was sent.
 */
function AnnounceCancellation({ itemId, announced }: { itemId: string; announced: boolean }) {
  const [state, action, pending] = useActionState(announceItemCancellation, initialState);

  if (announced || state.success) {
    return <p className="mt-1 text-xs font-medium text-emerald-700">✓ Müştəriyə bildirilib</p>;
  }

  return (
    <form action={action} className="mt-1.5">
      <input type="hidden" name="order_item_id" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-500 disabled:opacity-60"
      >
        {pending ? <Spinner className="h-3 w-3" /> : null}
        Müştəriyə bildir
      </button>
      {state.error ? <span className="ml-2 text-xs text-rose-700">{state.error}</span> : null}
    </form>
  );
}

const ITEM_STATUS_TONE: Record<OrderItemStatus, string> = {
  new: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-sky-50 text-sky-800 ring-sky-200",
  preparing: "bg-sky-50 text-sky-800 ring-sky-200",
  ready: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  awaiting_pickup: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  picked_up: "bg-violet-50 text-violet-800 ring-violet-200",
  delivered: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-rose-50 text-rose-800 ring-rose-200",
};

const ORDER_STEPS = ["Ödəniş", "Fermerlər", "Kuryer", "Çatdırıldı"];

/** Index of the step the order is on; ORDER_STEPS.length once delivered. */
function orderStepIndex(status: OrderStatus): number {
  switch (status) {
    case "awaiting_confirmation":
      return 0;
    case "confirmed":
    case "farmer_accepted":
    case "preparing":
      return 1;
    case "awaiting_courier":
    case "picked_up":
      return 2;
    default:
      return ORDER_STEPS.length;
  }
}

function flowIndex(status: OrderStatus): number {
  return ORDER_STATUS_FLOW.indexOf(status);
}

function Chip({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${tone}`}>
      {children}
    </span>
  );
}

function OrderSteps({ status }: { status: OrderStatus }) {
  const current = orderStepIndex(status);
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2" aria-label="Sifariş mərhələsi">
      {ORDER_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 last:flex-none">
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 text-xs font-medium ${
                done ? "text-emerald-700" : active ? "text-zinc-900" : "text-zinc-400"
              }`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white ${
                  done ? "bg-emerald-600" : active ? "bg-amber-500 ring-4 ring-amber-100" : "bg-zinc-200"
                }`}
                aria-hidden="true"
              >
                {done ? "✓" : ""}
              </span>
              <span className={active ? "" : "hidden sm:inline"}>{step}</span>
            </span>
            {index < ORDER_STEPS.length - 1 ? (
              <span className={`h-px min-w-3 flex-1 ${done ? "bg-emerald-300" : "bg-zinc-200"}`} aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{children}</h3>;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function FarmerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M4 20c1-4 4-6 8-6s7 2 8 6M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
    </svg>
  );
}

function AdminOrderCard({
  order,
  checked,
  onToggle,
  farmerMessages,
  statusAction,
  statusPending,
  statusResult,
  onStatusSubmit,
}: {
  order: AdminOrderListItemWithReceipt;
  checked: boolean;
  onToggle: () => void;
  farmerMessages?: string[];
  statusAction: (formData: FormData) => void;
  statusPending: boolean;
  /** The last status change's result, when it was made from this card. */
  statusResult: ActionResult | null;
  onStatusSubmit: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);
  const nextStatuses = ADMIN_STATUS_TRANSITIONS[order.status] ?? [];
  const forwardStatuses: OrderStatus[] = nextStatuses.filter((status) => status !== "cancelled");
  const canCancel = nextStatuses.includes("cancelled");
  const paymentStatus = firstPayment(order.payments)?.status ?? "pending";
  const items = order.order_items ?? [];
  const events = order.order_status_events ?? [];
  // A step its owner (farmers, then the courier) hasn't marked on every
  // line can't be shown to the customer; the action refuses it too.
  const blocked = (status: OrderStatus) => !adminCanSetStatus(status, items);

  // The customer's status against what the farmers have marked. Farmers
  // only see an order once it's paid, so before that there's nothing to
  // compare.
  const running = !(["awaiting_confirmation", "cancelled", "delivered"] as OrderStatus[]).includes(order.status);
  const fromFarmers = running ? statusFromLines(items) : null;
  const farmersAhead =
    fromFarmers !== null && flowIndex(fromFarmers) > flowIndex(order.status) && forwardStatuses.includes(fromFarmers);
  const farmersBehind = fromFarmers !== null && flowIndex(fromFarmers) < flowIndex(order.status);
  // The main button moves the customer up to what the farmers have marked.
  const suggested = farmersAhead && fromFarmers && !blocked(fromFarmers) ? fromFarmers : null;

  const recipient = recipientName(order);
  const customerName = order.customer?.full_name ?? order.customer?.email ?? null;
  const address = deliveryAddress(order);
  const discount = Number(order.discount_amount ?? 0);

  // Lines grouped by farmer, in the order they first appear.
  const farmers = new Map<string, { name: string; items: AdminOrderItem[] }>();
  for (const item of items) {
    const group = farmers.get(item.farmer_id) ?? {
      name: farmerDisplayName(item.farmers?.owner_name),
      items: [],
    };
    group.items.push(item);
    farmers.set(item.farmer_id, group);
  }

  return (
    <article
      id={`order-${order.id}`}
      className={`scroll-mt-20 overflow-hidden rounded-2xl bg-white shadow-sm ${
        checked ? "ring-2 ring-emerald-300" : farmerMessages ? "ring-2 ring-rose-300" : "ring-1 ring-zinc-200"
      }`}
    >
      {farmerMessages ? (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 sm:px-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
            Fermer statusu dəyişdi
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-rose-800">
            {farmerMessages.slice(0, 3).map((message, index) => (
              <li key={index} className="break-words">
                {message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Header: what, when, how much. */}
      <div className="flex items-start gap-3 px-4 pt-4 sm:px-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`${order.order_code} seç`}
          className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-semibold text-zinc-900">#{order.order_code}</span>
              <span className="ml-2 text-sm text-zinc-500">{formatDateTime(order.created_at)}</span>
            </div>
            <span className="shrink-0 text-lg font-semibold text-zinc-900">{formatPrice(order.total_amount)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Chip tone={getPaymentBadgeTone(paymentStatus)}>Ödəniş: {getPaymentStatusLabel(paymentStatus)}</Chip>
            <DeliveryDate createdAt={order.created_at} status={order.status} />
          </div>
        </div>
      </div>

      {/* The two statuses, side by side: what the customer sees, which the
          admin sets, and what the farmers have marked on their lines. */}
      <div className="mt-4 grid gap-3 px-4 sm:grid-cols-2 sm:px-5">
        <section className="rounded-xl bg-emerald-50/60 p-3 ring-1 ring-emerald-100">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
            <EyeIcon />
            Müştərinin gördüyü status
          </p>
          <p className="mt-1 text-base font-semibold text-zinc-900">{getOrderStatusLabel(order.status)}</p>
          {order.status !== "cancelled" ? (
            <div className="mt-2.5">
              <OrderSteps status={order.status} />
            </div>
          ) : null}
          {order.status === "awaiting_confirmation" ? (
            <p className="mt-2 text-xs text-amber-700">Ödəniş təsdiqi gözlənilir</p>
          ) : farmersAhead && fromFarmers ? (
            <p className="mt-2 text-xs font-medium text-sky-700">
              {statusOwner(fromFarmers) === "kuryer" ? "Kuryerə" : "Fermerlərə"} görə: {getOrderStatusLabel(fromFarmers)}
            </p>
          ) : farmersBehind ? (
            <p className="mt-2 text-xs font-medium text-amber-700">⚠ Fermerlərin statusundan irəlidədir</p>
          ) : fromFarmers ? (
            <p className="mt-2 text-xs font-medium text-emerald-700">✓ Fermerlərin statusuna uyğundur</p>
          ) : null}
        </section>

        <section className="rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-200">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
            <FarmerIcon />
            Fermerlərin qeyd etdiyi status
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {[...farmers.entries()].map(([farmerId, group]) => {
              const counts = new Map<OrderItemStatus, number>();
              for (const item of group.items) counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
              return (
                <li key={farmerId} className="flex flex-wrap items-center justify-between gap-1.5">
                  <span className="min-w-0 truncate text-sm text-zinc-800">{group.name}</span>
                  <span className="flex flex-wrap gap-1">
                    {[...counts.entries()].map(([status, count]) => (
                      <Chip key={status} tone={ITEM_STATUS_TONE[status] ?? ITEM_STATUS_TONE.new}>
                        {getOrderItemStatusLabel(status)}
                        {counts.size > 1 || count > 1 ? ` · ${count}` : ""}
                      </Chip>
                    ))}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* Customer and delivery | payment. */}
      <div className="mt-4 grid gap-px border-y border-zinc-100 bg-zinc-100 sm:grid-cols-2">
        <section className="bg-white px-4 py-3 sm:px-5">
          <SectionTitle>Müştəri və çatdırılma</SectionTitle>
          <p className="mt-1.5 break-words text-sm font-medium text-zinc-900">{recipient ?? customerName ?? "Müştəri"}</p>
          {recipient && customerName && customerName !== recipient ? (
            <p className="text-xs text-zinc-500">Sifarişçi: {customerName}</p>
          ) : null}
          {order.contact_phone ? (
            <a
              href={`tel:${order.contact_phone.replace(/\s+/g, "")}`}
              className="mt-1 inline-block text-sm text-emerald-700 hover:underline"
            >
              {order.contact_phone}
            </a>
          ) : null}
          {address ? <p className="mt-1 break-words text-sm text-zinc-600">{address}</p> : null}
          {order.order_note ? (
            <p className="mt-2 whitespace-pre-line break-words rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm text-amber-900">
              Qeyd: {order.order_note}
            </p>
          ) : null}
        </section>

        <section className="bg-white px-4 py-3 sm:px-5">
          <SectionTitle>Ödəniş</SectionTitle>
          <dl className="mt-1.5 space-y-1 text-sm">
            <div className="flex justify-between gap-3 text-zinc-600">
              <dt>Məhsullar</dt>
              <dd>{formatPrice(Number(order.subtotal))}</dd>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between gap-3 text-emerald-700">
                <dt>Endirim{order.promo_code ? ` (${order.promo_code})` : ""}</dt>
                <dd>−{formatPrice(discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 text-zinc-600">
              <dt>Çatdırılma</dt>
              <dd>{formatPrice(Number(order.delivery_fee))}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-zinc-100 pt-1 font-semibold text-zinc-900">
              <dt>Cəmi</dt>
              <dd>{formatPrice(order.total_amount)}</dd>
            </div>
          </dl>
          {order.receiptSignedUrl ? (
            <a
              href={order.receiptSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-3.5 w-3.5">
                <path d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" strokeLinejoin="round" />
              </svg>
              Çeki aç
            </a>
          ) : null}
        </section>
      </div>

      {/* Lines, by farmer, each with the status its farmer marked. */}
      {items.length > 0 ? (
        <section className="px-4 py-3 sm:px-5">
          <SectionTitle>Məhsullar</SectionTitle>
          <div className="mt-2 space-y-3">
            {[...farmers.entries()].map(([farmerId, group]) => (
              <div key={farmerId}>
                <p className="text-xs font-semibold text-zinc-700">{group.name}</p>
                <ul className="mt-1 divide-y divide-zinc-100 rounded-xl ring-1 ring-zinc-100">
                  {group.items.map((item) => {
                    const cancelled = item.status === "cancelled";
                    return (
                      <li key={item.id} className="px-3 py-2">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className={`min-w-0 flex-1 basis-40 text-sm font-medium ${
                              cancelled ? "text-zinc-400 line-through" : "text-zinc-900"
                            }`}
                          >
                            {item.product_title}
                          </span>
                          <span className="text-sm text-zinc-600">
                            {formatAmount(item.unit_type, item.quantity, item.unit_size)}
                          </span>
                          <span className="w-16 text-right text-sm text-zinc-900">
                            {formatPrice(Number(item.line_total))}
                          </span>
                          <Chip tone={ITEM_STATUS_TONE[item.status] ?? ITEM_STATUS_TONE.new}>
                            {getOrderItemStatusLabel(item.status)}
                          </Chip>
                        </div>
                        {cancelled && item.cancel_reason ? (
                          <div className="mt-1">
                            <p className="whitespace-pre-line break-words text-xs text-rose-700">
                              Ləğv səbəbi: {item.cancel_reason}
                            </p>
                            {order.status !== "cancelled" ? (
                              <AnnounceCancellation
                                itemId={item.id}
                                announced={events.some(
                                  (event) =>
                                    event.order_item_id === item.id && event.status === ITEM_CANCEL_ANNOUNCED,
                                )}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Footer: history on the left; on the right, changing the status the
          customer sees. */}
      <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/70 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <details className="min-w-0 flex-1 text-sm">
          <summary className="cursor-pointer font-medium text-zinc-700">
            Sifariş keçmişi
            {events.length > 0 ? <span className="ml-1 font-normal text-zinc-500">({events.length})</span> : null}
          </summary>
          <p className="mt-2 break-all text-xs text-zinc-400">ID: {order.id}</p>
          <div className="mt-2">
            <OrderStatusTimeline events={events} compact />
          </div>
        </details>

        {nextStatuses.length > 0 ? (
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800">
              <EyeIcon />
              Müştəri statusunu dəyiş
            </p>
            {cancelling ? (
              <form action={statusAction} onSubmit={onStatusSubmit} className="flex w-full flex-col gap-2 sm:w-80">
                <input type="hidden" name="order_id" value={order.id} />
                <input type="hidden" name="next_status" value="cancelled" />
                <ReasonInput id={`cancel-reason-${order.id}`} />
                <div className="flex gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setCancelling(false)}
                    className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100 sm:flex-none"
                  >
                    Geri
                  </button>
                  <button
                    type="submit"
                    disabled={statusPending}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-70 sm:flex-none"
                  >
                    {statusPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                    Ləğvi təsdiqlə
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {forwardStatuses.length > 0 ? (
                  <form action={statusAction} onSubmit={onStatusSubmit} className="flex items-center gap-1.5">
                    <input type="hidden" name="order_id" value={order.id} />
                    <label htmlFor={`next-${order.id}`} className="sr-only">
                      Yeni status
                    </label>
                    <select
                      id={`next-${order.id}`}
                      name="next_status"
                      required
                      defaultValue=""
                      className="max-w-[14rem] rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700"
                    >
                      <option value="" disabled>
                        Status seçin…
                      </option>
                      {forwardStatuses.map((status) => (
                        <option key={status} value={status} disabled={blocked(status)}>
                          {getOrderStatusLabel(status)}
                          {blocked(status) ? ` (${statusOwner(status)} hələ qeyd etməyib)` : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      disabled={statusPending}
                      className="rounded-full px-3 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 disabled:opacity-70"
                    >
                      Yenilə
                    </button>
                  </form>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    onClick={() => setCancelling(true)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-medium text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50"
                  >
                    Ləğv et
                  </button>
                ) : null}
                {suggested ? (
                  <form action={statusAction} onSubmit={onStatusSubmit} className="w-full sm:w-auto">
                    <input type="hidden" name="order_id" value={order.id} />
                    <button
                      type="submit"
                      name="next_status"
                      value={suggested}
                      disabled={statusPending}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
                    >
                      {statusPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                      {statusOwner(suggested) === "kuryer" ? "Kuryerə" : "Fermerlərə"} uyğunlaşdır: {getOrderStatusLabel(suggested)}
                    </button>
                  </form>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
      {statusResult?.error || statusResult?.success ? (
        <p
          className={`border-t px-4 py-2.5 text-sm sm:px-5 ${
            statusResult.error
              ? "border-rose-100 bg-rose-50 text-rose-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-800"
          }`}
        >
          {statusResult.error || statusResult.success}
        </p>
      ) : null}
    </article>
  );
}

export function AdminOrdersPanel({
  orders,
  farmerUpdates = [],
}: {
  orders: AdminOrderListItemWithReceipt[];
  farmerUpdates?: FarmerOrderUpdate[];
}) {
  // Kept from the first render: opening the page marks the updates seen,
  // which clears the sidebar badge, but they stay red while the admin is here.
  const [updates] = useState(
    () => new Map(farmerUpdates.map((update) => [update.orderId, update.messages])),
  );
  useEffect(() => {
    if (updates.size > 0) void markFarmerOrderUpdatesSeen();
  }, [updates]);
  const updatedOrders = orders.filter((order) => updates.has(order.id));

  const [statusState, statusAction, statusPending] = useActionState(
    advanceOrderStatus,
    initialState
  );
  // The status result shows in the card it was submitted from: at the top
  // of a long list the admin would not see it.
  const [statusOrderId, setStatusOrderId] = useState<string | null>(null);
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteOrders,
    initialState
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastDeleteSuccess, setLastDeleteSuccess] = useState(
    deleteState.success
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const filteredOrders = orders.filter((order) =>
    matchesAdminOrderQuery(order, deferredSearch)
  );

  if (deleteState.success !== lastDeleteSuccess) {
    setLastDeleteSuccess(deleteState.success);
    if (deleteState.success && selectedIds.length > 0) {
      setSelectedIds([]);
    }
  }

  // Selection is stored raw and narrowed to what is currently visible, so a
  // hidden order can never be submitted to the delete action.
  const visibleIds = new Set(filteredOrders.map((order) => order.id));
  const selected = selectedIds.filter((id) => visibleIds.has(id));

  const allSelected =
    filteredOrders.length > 0 && selected.length === filteredOrders.length;
  const someSelected = selected.length > 0;

  function toggleAll() {
    setSelectedIds(
      allSelected ? [] : filteredOrders.map((order) => order.id)
    );
  }

  function toggleOne(orderId: string) {
    setSelectedIds((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Başlıq, sifariş kodu/ID və ya müştəri adı..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
          autoComplete="off"
        />
        {search.trim() ? (
          <p className="mt-2 text-xs text-zinc-500">
            {filteredOrders.length} nəticə
          </p>
        ) : null}
      </div>

      {updatedOrders.length > 0 ? (
        <section className="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-800">
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white">
              {updatedOrders.length}
            </span>
            Fermer sifariş statusunu dəyişib
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {updatedOrders.map((order) => (
              <li key={order.id}>
                <a
                  href={`#order-${order.id}`}
                  className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
                >
                  {order.order_code}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {deleteState.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {deleteState.error}
        </p>
      ) : null}
      {deleteState.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {deleteState.success}
        </p>
      ) : null}

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="font-medium text-zinc-900">
            {search.trim()
              ? "Axtarışa uyğun sifariş tapılmadı"
              : "Sifariş yoxdur"}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-200 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              {allSelected ? "Seçimi ləğv et" : "Hamısını seç"}
              {someSelected ? (
                <span className="text-zinc-500">({selected.length})</span>
              ) : null}
            </label>

            <form
              action={deleteAction}
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    selected.length === 1
                      ? "Bu sifarişi silmək istəyirsiniz?"
                      : `${selected.length} sifarişi silmək istəyirsiniz?`
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              {selected.map((id) => (
                <input key={id} type="hidden" name="order_ids" value={id} />
              ))}
              <button
                type="submit"
                disabled={!someSelected || deletePending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50 sm:w-auto"
              >
                {deletePending ? <Spinner className="h-3.5 w-3.5" /> : null}
                Seçilənləri sil
              </button>
            </form>
          </div>

          {filteredOrders.map((order) => (
            <AdminOrderCard
              key={order.id}
              order={order}
              checked={selected.includes(order.id)}
              onToggle={() => toggleOne(order.id)}
              farmerMessages={updates.get(order.id)}
              statusAction={statusAction}
              statusPending={statusPending}
              statusResult={statusOrderId === order.id ? statusState : null}
              onStatusSubmit={() => setStatusOrderId(order.id)}
            />
          ))}
        </>
      )}
    </div>
  );
}
