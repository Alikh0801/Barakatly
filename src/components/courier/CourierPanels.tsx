"use client";

import { useActionState } from "react";
import {
  advanceCourierOrder,
  type CourierActionState,
} from "@/lib/courier/actions";
import {
  COURIER_ORDER_STATUS_TRANSITIONS,
  getOrderItemStatusLabel,
  getOrderStatusLabel,
} from "@/lib/orders/labels";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice } from "@/lib/shop/format";
import type { CourierOrder } from "@/lib/courier/queries";
import type { OrderStatus } from "@/types";

const initialState: CourierActionState = {};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function CourierOrderCard({ order }: { order: CourierOrder }) {
  const [state, action, pending] = useActionState(
    advanceCourierOrder,
    initialState
  );
  const nextStatuses = COURIER_ORDER_STATUS_TRANSITIONS[order.status] ?? [];

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      {state.error ? (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900">{order.order_code}</div>
          <p className="mt-1 text-sm text-zinc-500">{formatDate(order.created_at)}</p>
          <p className="mt-2 text-sm text-zinc-700">{order.contact_phone}</p>
          <p className="mt-1 text-sm text-zinc-600">
            {order.delivery_address_text ?? "Ünvan qeyd olunmayıb"}
          </p>
        </div>
        <div className="text-right">
          <div className="font-semibold text-zinc-900">
            {formatPrice(order.total_amount)}
          </div>
          <div className="mt-2 text-xs font-medium text-zinc-700">
            {getOrderStatusLabel(order.status)}
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1 text-sm text-zinc-600">
        {order.order_items.map((item) => (
          <li key={item.id}>
            {item.product_title} × {item.quantity} —{" "}
            {getOrderItemStatusLabel(item.status)}
          </li>
        ))}
      </ul>

      {nextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="order_id" value={order.id} />
          <select
            name="next_status"
            required
            defaultValue={nextStatuses[0]}
            className="rounded-xl border border-zinc-200 px-3 py-2 text-sm"
          >
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {getOrderStatusLabel(status as OrderStatus)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Yenilə
          </button>
        </form>
      ) : null}
    </article>
  );
}

export function CourierQueue({ orders }: { orders: CourierOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Hazırda çatdırılacaq sifariş yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <CourierOrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
