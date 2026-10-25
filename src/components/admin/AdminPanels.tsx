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
import {
  ADMIN_STATUS_TRANSITIONS,
  getOrderItemStatusLabel,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { firstPayment } from "@/lib/orders/payment";
import { deliveryAddress, recipientName } from "@/lib/orders/delivery";
import { ITEM_CANCEL_ANNOUNCED } from "@/lib/orders/item-cancel";
import { matchesAdminOrderQuery } from "@/lib/orders/admin-order-filter";
import type {
  AdminOrderListItem,
  AdminPendingPayment,
  FarmerOrderUpdate,
} from "@/lib/admin/queries";
import type { OrderStatus } from "@/types";
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
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteOrders,
    initialState
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastDeleteSuccess, setLastDeleteSuccess] = useState(
    deleteState.success
  );
  const [cancelSelection, setCancelSelection] = useState<
    Record<string, boolean>
  >({});
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

          {filteredOrders.map((order) => {
            const nextStatuses = ADMIN_STATUS_TRANSITIONS[order.status] ?? [];
            const paymentStatus =
              firstPayment(order.payments)?.status ?? "pending";
            const items = order.order_items ?? [];
            const events = order.order_status_events ?? [];
            const isChecked = selected.includes(order.id);
            const farmerMessages = updates.get(order.id);

            return (
              <article
                key={order.id}
                id={`order-${order.id}`}
                className={`scroll-mt-20 rounded-2xl bg-white p-4 shadow-sm sm:p-5 ${
                  isChecked
                    ? "ring-1 ring-emerald-300"
                    : farmerMessages
                      ? "ring-2 ring-rose-300"
                      : "ring-1 ring-zinc-200"
                }`}
              >
                {farmerMessages ? (
                  <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 ring-1 ring-rose-200">
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
                          {formatDateTime(order.created_at)}
                        </p>
                        <p className="mt-2 break-all text-sm text-zinc-700">
                          {order.customer?.full_name ??
                            order.customer?.email ??
                            "Müştəri"}
                        </p>
                        {recipientName(order) ? (
                          <p className="mt-1 text-sm text-zinc-600">
                            Alıcı: {recipientName(order)} · {order.contact_phone}
                          </p>
                        ) : null}
                        {deliveryAddress(order) ? (
                          <p className="mt-1 break-words text-sm text-zinc-600">
                            {deliveryAddress(order)}
                          </p>
                        ) : null}
                        {order.order_note ? (
                          <p className="mt-1 whitespace-pre-line break-words text-sm text-zinc-500">
                            Qeyd: {order.order_note}
                          </p>
                        ) : null}
                      </div>
                      <div className="shrink-0 sm:text-right">
                        <div className="font-semibold text-zinc-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        {order.promo_code && Number(order.discount_amount) > 0 ? (
                          <div className="mt-0.5 text-xs text-emerald-700">
                            {order.promo_code} · −{formatPrice(Number(order.discount_amount))}
                          </div>
                        ) : null}
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
                                  {farmerDisplayName(item.farmers?.owner_name)} ·{" "}
                                  {formatAmount(item.unit_type, item.quantity, item.unit_size)}
                                  {item.status === "cancelled" ? ` · ${formatPrice(Number(item.line_total))}` : ""}
                                </p>
                                {item.status === "cancelled" && item.cancel_reason ? (
                                  <>
                                    <p className="mt-0.5 whitespace-pre-line break-words text-xs text-rose-700">
                                      Ləğv səbəbi: {item.cancel_reason}
                                    </p>
                                    {order.status !== "cancelled" ? (
                                      <AnnounceCancellation
                                        itemId={item.id}
                                        announced={events.some(
                                          (event) =>
                                            event.order_item_id === item.id &&
                                            event.status === ITEM_CANCEL_ANNOUNCED,
                                        )}
                                      />
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                      <span
                        className={`inline-flex w-fit max-w-[16rem] shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                          item.status === "cancelled"
                            ? "bg-rose-50 text-rose-800 ring-rose-200"
                            : "bg-sky-50 text-sky-900 ring-sky-200"
                        }`}
                      >
                        {getOrderItemStatusLabel(item.status)}
                      </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {order.receiptSignedUrl ? (
                      <a
                        href={order.receiptSignedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200 sm:w-auto"
                      >
                        Ödəniş çekini gör
                      </a>
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
                            onChange={(event) =>
                              setCancelSelection((prev) => ({
                                ...prev,
                                [order.id]: event.target.value === "cancelled",
                              }))
                            }
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
                        {cancelSelection[order.id] ? (
                          <div className="w-full sm:w-64">
                            <ReasonInput id={`cancel-reason-${order.id}`} />
                          </div>
                        ) : null}
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
