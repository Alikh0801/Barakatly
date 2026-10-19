import type { OrderStatus, OrderStatusEvent } from "@/types";
import { ORDER_STATUS_FLOW, getOrderStatusLabel } from "@/lib/orders/labels";
import { formatDateTime } from "@/lib/format/date";

/**
 * When the order first reached each status, from its order-level events.
 * Steps the admin skipped have no time.
 */
function reachedAt(events: OrderStatusEvent[], createdAt: string) {
  const times = new Map<string, string>([["awaiting_confirmation", createdAt]]);
  const sorted = [...events]
    .filter((event) => !event.order_item_id)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  for (const event of sorted) {
    if (!times.has(event.status)) times.set(event.status, event.created_at);
  }
  return times;
}

export function OrderStatusTracker({
  status,
  events,
  createdAt,
}: {
  status: OrderStatus;
  events: OrderStatusEvent[];
  createdAt: string;
}) {
  const times = reachedAt(events, createdAt);

  if (status === "cancelled") {
    const cancelledAt = times.get("cancelled");
    return (
      <div className="rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200">
        <p className="text-sm font-semibold text-rose-800">Sifariş ləğv edildi</p>
        {cancelledAt ? (
          <p className="mt-1 text-xs tabular-nums text-rose-700">
            {formatDateTime(cancelledAt)}
          </p>
        ) : null}
        <p className="mt-1 text-sm text-rose-700">
          Bu sifariş davam etdirilmir.
        </p>
      </div>
    );
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(status);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900">Sifariş statusu</h2>
      <ol className="mt-5 space-y-3">
        {ORDER_STATUS_FLOW.map((step, index) => {
          const done = index <= currentIndex;
          const current = index === currentIndex;
          const time = done ? times.get(step) : undefined;

          return (
            <li key={step} className="flex items-center gap-3">
              <span
                className={[
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  done
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200",
                ].join(" ")}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={[
                  "min-w-0 flex-1 text-sm",
                  current
                    ? "font-semibold text-zinc-900"
                    : done
                      ? "font-medium text-zinc-700"
                      : "text-zinc-500",
                ].join(" ")}
              >
                {getOrderStatusLabel(step)}
              </span>
              {time ? (
                <time
                  dateTime={time}
                  className="shrink-0 text-xs tabular-nums text-zinc-500"
                >
                  {formatDateTime(time)}
                </time>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
