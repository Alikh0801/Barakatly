"use client";

import { useActionState, useState } from "react";
import {
  advanceCourierOrder,
  type CourierActionState,
} from "@/lib/courier/actions";
import { getOrderItemStatusLabel, getOrderStatusLabel } from "@/lib/orders/labels";
import { Spinner } from "@/components/ui/Spinner";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import { formatDateTime } from "@/lib/format/date";
import { DeliveryDate } from "@/components/orders/DeliveryDate";
import { formatAmount } from "@/lib/shop/quantity";
import type { CourierOrder } from "@/lib/courier/queries";
import { deliveryAddress, recipientName } from "@/lib/orders/delivery";
import type { OrderStatus } from "@/types";
import { farmerDisplayName } from "@/lib/farmers/name";

const initialState: CourierActionState = {};

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
        placeholder="Çatdırıla bilmədiyi səbəbi qeyd edin..."
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
      />
    </div>
  );
}

function getCourierStatusOptionLabel(status: OrderStatus): string {
  if (status === "picked_up") return "Götürdüm";
  if (status === "cancelled") return "Çatdırıla bilmədi";
  return getOrderStatusLabel(status);
}

/** When a closed order was delivered, or given up on. */
function closedAt(order: CourierOrder): string | null {
  const event = [...order.order_status_events]
    .reverse()
    .find((e) => !e.order_item_id && (e.status === "delivered" || e.status === "cancelled"));
  return event?.created_at ?? null;
}

function CourierOrderCard({ order }: { order: CourierOrder }) {
  const closed = order.status === "delivered" || order.status === "cancelled";
  const closedTime = closed ? closedAt(order) : null;
  const [state, action, pending] = useActionState(
    advanceCourierOrder,
    initialState
  );
  const nextStatuses = order.next_statuses;
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">(
    nextStatuses[0] ?? ""
  );

  const farmers = new Map<string, { name: string; location: string | null; items: string[] }>();
  for (const item of order.order_items) {
    const farmerId = item.farmer_id;
    const existing = farmers.get(farmerId);
    const line = `${item.product_title} — ${formatAmount(item.unit_type, item.quantity, item.unit_size)} (${getOrderItemStatusLabel(item.status)})`;
    if (existing) {
      existing.items.push(line);
    } else {
      farmers.set(farmerId, {
        name: farmerDisplayName(item.farmers?.owner_name),
        location: item.farmers?.location_text ?? null,
        items: [line],
      });
    }
  }

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
          <p className="mt-1 text-sm text-zinc-500">{formatDateTime(order.created_at)}</p>
          <DeliveryDate createdAt={order.created_at} status={order.status} className="mt-1.5" />
          {recipientName(order) ? (
            <p className="mt-2 text-sm font-medium text-zinc-900">
              Alıcı: {recipientName(order)}
            </p>
          ) : null}
          {/* A closed order no longer needs the customer's phone. */}
          {closed ? null : (
            <p className={`${recipientName(order) ? "mt-1" : "mt-2"} text-sm text-zinc-700`}>
              Müştəri telefonu: {order.contact_phone}
            </p>
          )}
          <p className="mt-1 text-sm text-zinc-600">
            Çatdırılma: {deliveryAddress(order) ?? "Ünvan qeyd olunmayıb"}
          </p>
          {order.order_note ? (
            <p className="mt-1 whitespace-pre-line break-words text-sm text-zinc-600">
              Qeyd: {order.order_note}
            </p>
          ) : null}
        </div>
        <div className="text-xs font-medium text-zinc-700 sm:text-right">
          {/* Picked up but not yet shown to the customer by the admin. */}
          {order.picked_up_by_me && order.status === "awaiting_courier"
            ? "Götürülüb"
            : order.status === "cancelled"
              ? "Çatdırıla bilmədi"
              : getOrderStatusLabel(order.status)}
          {closedTime ? (
            <div className="mt-0.5 font-normal text-zinc-500">{formatDateTime(closedTime)}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {[...farmers.values()].map((farmer) => (
          <div
            key={`${farmer.name}-${farmer.location ?? ""}`}
            className="rounded-xl bg-zinc-50 px-3 py-3 ring-1 ring-zinc-100"
          >
            <div className="text-sm font-semibold text-zinc-900">{farmer.name}</div>
            {farmer.location ? (
              <p className="mt-0.5 text-xs text-zinc-500">{farmer.location}</p>
            ) : null}
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {farmer.items.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <details className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm ring-1 ring-zinc-100">
        <summary className="cursor-pointer font-medium text-zinc-800">
          Sifariş tarixçəsi
          <span className="ml-1 font-normal text-zinc-500">({order.order_status_events.length})</span>
        </summary>
        <div className="mt-3">
          <OrderStatusTimeline events={order.order_status_events} compact />
        </div>
      </details>

      {nextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="order_id" value={order.id} />
          <select
            name="next_status"
            required
            defaultValue={nextStatuses[0]}
            onChange={(event) =>
              setSelectedStatus(event.target.value as OrderStatus)
            }
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {getCourierStatusOptionLabel(status as OrderStatus)}
              </option>
            ))}
          </select>
          {selectedStatus === "cancelled" ? (
            <div className="w-full sm:w-64">
              <ReasonInput id={`courier-fail-reason-${order.id}`} />
            </div>
          ) : null}
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

/** Orders this courier has delivered, or could not deliver. */
export function CourierHistory({ orders }: { orders: CourierOrder[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Hələ bağlanmış sifariş yoxdur</p>
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
