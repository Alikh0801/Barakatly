import type { OrderStatusEvent } from "@/types";
import { getEventStatusLabel } from "@/lib/orders/labels";
import { formatDateTime } from "@/lib/format/date";

export function OrderStatusTimeline({
  events,
  title = "Status tarixçəsi",
  compact = false,
}: {
  events: OrderStatusEvent[];
  title?: string;
  compact?: boolean;
}) {
  if (!events.length) {
    if (compact) {
      return (
        <p className="text-sm text-zinc-500">Hələ status yenilənməsi yoxdur.</p>
      );
    }

    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
        <p className="mt-3 text-sm text-zinc-500">Hələ status yenilənməsi yoxdur.</p>
      </section>
    );
  }

  const list = (
    <ol className={compact ? "space-y-3" : "mt-5 space-y-4"}>
      {[...events].reverse().map((event, index) => (
        <li key={event.id} className="relative flex gap-3">
          {index < events.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-zinc-200"
            />
          ) : null}
          <span
            className={`relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-600 ${
              compact ? "ring-2 ring-emerald-50" : "ring-4 ring-emerald-50"
            }`}
          />
          <div>
            <div className="text-sm font-medium text-zinc-900">
              {getEventStatusLabel(event.status)}
            </div>
            {event.note ? (
              <p className="mt-0.5 text-sm text-zinc-600">{event.note}</p>
            ) : null}
            <p className="mt-1 text-xs text-zinc-500">
              {formatDateTime(event.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );

  if (compact) return list;

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
      {list}
    </section>
  );
}
