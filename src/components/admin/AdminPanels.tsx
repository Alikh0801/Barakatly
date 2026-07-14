"use client";

import { useActionState } from "react";
import {
  advanceOrderStatus,
  confirmPayment,
  rejectPayment,
} from "@/lib/admin/actions";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice } from "@/lib/shop/format";
import {
  ADMIN_STATUS_TRANSITIONS,
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import type { AdminOrderListItem, AdminPendingPayment } from "@/lib/admin/queries";
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
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900">
            {order?.order_code ?? "Sifariş"}
          </div>
          <p className="mt-1 text-sm text-zinc-500">
            {order ? formatDate(order.created_at) : formatDate(payment.created_at)}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            {payment.banks?.name ?? "Bank"} · {payment.banks?.pan_number}
          </p>
          {order?.contact_phone ? (
            <p className="mt-1 text-sm text-zinc-600">{order.contact_phone}</p>
          ) : null}
        </div>
        <div className="text-right">
          <div className="font-semibold text-zinc-900">
            {order ? formatPrice(order.total_amount) : "—"}
          </div>
          <div className="mt-2 text-xs font-medium text-amber-800">
            {getPaymentStatusLabel(payment.status)}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {payment.receiptSignedUrl ? (
          <a
            href={payment.receiptSignedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-200"
          >
            Çeki aç
          </a>
        ) : null}
        <form action={confirmAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <button
            type="submit"
            disabled={confirmPending || rejectPending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
          >
            {confirmPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Təsdiqlə
          </button>
        </form>
        <form action={rejectAction}>
          <input type="hidden" name="payment_id" value={payment.id} />
          <button
            type="submit"
            disabled={confirmPending || rejectPending}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-70"
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

export function AdminOrdersPanel({ orders }: { orders: AdminOrderListItem[] }) {
  const [state, formAction, pending] = useActionState(
    advanceOrderStatus,
    initialState
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Sifariş yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {state.success}
        </p>
      ) : null}

      {orders.map((order) => {
        const nextStatuses = ADMIN_STATUS_TRANSITIONS[order.status] ?? [];
        const paymentStatus = order.payments?.[0]?.status ?? "pending";

        return (
          <article
            key={order.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-900">{order.order_code}</div>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(order.created_at)}
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  {order.customer?.full_name ??
                    order.customer?.email ??
                    "Müştəri"}
                </p>
              </div>
              <div className="text-right">
                <div className="font-semibold text-zinc-900">
                  {formatPrice(order.total_amount)}
                </div>
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                    Ödəniş: {getPaymentStatusLabel(paymentStatus)}
                  </span>
                </div>
              </div>
            </div>

            {nextStatuses.length > 0 ? (
              <form
                action={formAction}
                className="mt-4 flex flex-wrap items-end gap-2"
              >
                <input type="hidden" name="order_id" value={order.id} />
                <div>
                  <label
                    htmlFor={`next-${order.id}`}
                    className="block text-xs font-medium text-zinc-600"
                  >
                    Növbəti status
                  </label>
                  <select
                    id={`next-${order.id}`}
                    name="next_status"
                    required
                    className="mt-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
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
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
                >
                  {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
                  Yenilə
                </button>
              </form>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
