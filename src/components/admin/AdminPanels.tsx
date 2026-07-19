"use client";

import { useActionState, useEffect, useState } from "react";
import {
  advanceOrderStatus,
  confirmPayment,
  deleteOrders,
  rejectPayment,
} from "@/lib/admin/actions";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import {
  ADMIN_STATUS_TRANSITIONS,
  getOrderItemStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { firstPayment } from "@/lib/orders/payment";
import { summarizeFarmerItemProgress } from "@/lib/orders/farmer-progress";
import type {
  AdminOrderItem,
  AdminOrderListItem,
  AdminPendingPayment,
} from "@/lib/admin/queries";
import type { OrderStatus } from "@/types";

type ActionResult = { error?: string; success?: string };

const initialState: ActionResult = {};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
            {formatDate(order?.created_at ?? payment.created_at)}
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
        <form action={rejectAction} className="w-full sm:w-auto">
          <input type="hidden" name="payment_id" value={payment.id} />
          <button
            type="submit"
            disabled={confirmPending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-70 sm:w-auto"
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

function farmerProgressHint(
  orderStatus: OrderStatus,
  items: AdminOrderItem[]
): string | null {
  const progress = summarizeFarmerItemProgress(items);
  if (progress.total === 0) return null;

  if (progress.allReady && orderStatus === "preparing") {
    return "Bütün məhsullar hazırdır — sifarişi «Götürüldü» edə bilərsiniz.";
  }
  if (progress.allPreparingOrBeyond && orderStatus === "farmer_accepted") {
    return "Fermerlər hazırlığa keçib — sifarişi «Hazırlanır» edə bilərsiniz.";
  }
  if (progress.allAccepted && orderStatus === "confirmed") {
    return "Bütün fermerlər qəbul edib — sifarişi «Fermer qəbul etdi» edə bilərsiniz.";
  }
  if (!progress.allAccepted && orderStatus === "confirmed") {
    return `Fermer irəliləyişi: ${progress.readyCount}/${progress.total} hazır · ən geridə: ${progress.lowestLabel ?? "—"}.`;
  }
  if (
    progress.total > 0 &&
    orderStatus !== "delivered" &&
    orderStatus !== "cancelled"
  ) {
    return `Fermer məhsulları: ${progress.readyCount}/${progress.total} hazırdır.`;
  }
  return null;
}

export function AdminOrdersPanel({
  orders,
  query = "",
}: {
  orders: AdminOrderListItem[];
  query?: string;
}) {
  const [statusState, statusAction, statusPending] = useActionState(
    advanceOrderStatus,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteOrders,
    initialState
  );
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (deleteState.success) {
      setSelected([]);
    }
  }, [deleteState.success]);

  const allSelected =
    orders.length > 0 && selected.length === orders.length;
  const someSelected = selected.length > 0;

  function toggleAll() {
    setSelected(allSelected ? [] : orders.map((order) => order.id));
  }

  function toggleOne(orderId: string) {
    setSelected((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  }

  return (
    <div className="space-y-4">
      <form action="/admin/orders" className="flex flex-col gap-2 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Başlıq, sifariş kodu/ID və ya müştəri adı..."
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500/30 focus:ring-2"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:flex-none"
          >
            Axtar
          </button>
          {query ? (
            <a
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
            >
              Təmizlə
            </a>
          ) : null}
        </div>
      </form>

      {statusState.error || deleteState.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {statusState.error || deleteState.error}
        </p>
      ) : null}
      {statusState.success || deleteState.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {statusState.success || deleteState.success}
        </p>
      ) : null}

      {orders.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
          <p className="font-medium text-zinc-900">
            {query ? "Axtarışa uyğun sifariş tapılmadı" : "Sifariş yoxdur"}
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

          {orders.map((order) => {
            const nextStatuses = ADMIN_STATUS_TRANSITIONS[order.status] ?? [];
            const paymentStatus =
              firstPayment(order.payments)?.status ?? "pending";
            const items = order.order_items ?? [];
            const events = order.order_status_events ?? [];
            const hint = farmerProgressHint(order.status, items);
            const isChecked = selected.includes(order.id);

            return (
              <article
                key={order.id}
                className={`rounded-2xl bg-white p-4 shadow-sm ring-1 sm:p-5 ${
                  isChecked ? "ring-emerald-300" : "ring-zinc-200"
                }`}
              >
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(order.id)}
                    aria-label={`${order.order_code} seç`}
                    className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-900">
                          {order.order_code}
                        </div>
                        <p className="mt-1 break-all text-xs text-zinc-400">
                          ID: {order.id}
                        </p>
                        <p className="mt-1 text-sm text-zinc-500">
                          {formatDate(order.created_at)}
                        </p>
                        <p className="mt-2 break-all text-sm text-zinc-700">
                          {order.customer?.full_name ??
                            order.customer?.email ??
                            "Müştəri"}
                        </p>
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <div className="font-semibold text-zinc-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 sm:justify-end">
                          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                            {getOrderStatusLabel(order.status)}
                          </span>
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                            Ödəniş: {getPaymentStatusLabel(paymentStatus)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {items.length > 0 ? (
                      <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                          Fermer məhsul statusları
                        </p>
                        <ul className="space-y-2">
                          {items.map((item) => (
                            <li
                              key={item.id}
                              className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-zinc-900">
                                  {item.product_title}
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {item.farmers?.farm_name ?? "Fermer"} ·{" "}
                                  {item.quantity} {formatUnit(item.unit_type)}
                                </p>
                              </div>
                              <span className="inline-flex w-fit shrink-0 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200">
                                {getOrderItemStatusLabel(item.status)}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {hint ? (
                          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-900 ring-1 ring-emerald-200">
                            {hint}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    <details className="mt-4 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-100">
                      <summary className="cursor-pointer text-sm font-medium text-zinc-800">
                        Sifariş keçmişi
                        {events.length > 0 ? (
                          <span className="ml-1 font-normal text-zinc-500">
                            ({events.length})
                          </span>
                        ) : null}
                      </summary>
                      <div className="mt-3">
                        <OrderStatusTimeline events={events} compact />
                      </div>
                    </details>

                    {nextStatuses.length > 0 ? (
                      <form
                        action={statusAction}
                        className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
                      >
                        <input type="hidden" name="order_id" value={order.id} />
                        <div className="w-full sm:w-auto sm:min-w-[200px]">
                          <label
                            htmlFor={`next-${order.id}`}
                            className="block text-xs font-medium text-zinc-600"
                          >
                            Sifariş statusu (müştəriyə görünür)
                          </label>
                          <select
                            id={`next-${order.id}`}
                            name="next_status"
                            required
                            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Seçin
                            </option>
                            {nextStatuses.map((status) => (
                              <option key={status} value={status}>
                                {getOrderStatusLabel(status as OrderStatus)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={statusPending}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70 sm:w-auto"
                        >
                          {statusPending ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : null}
                          Yenilə
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </>
      )}
    </div>
  );
}
