import type { OrderStatusEvent } from "@/types";
import { getEventStatusLabel } from "@/lib/orders/labels";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OrderStatusTimeline({
  events,
}: {
  events: OrderStatusEvent[];
}) {
  if (!events.length) {
    return (
      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <h2 className="text-lg font-semibold text-zinc-900">Status tarixçəsi</h2>
        <p className="mt-3 text-sm text-zinc-500">Hələ status yenilənməsi yoxdur.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
      <h2 className="text-lg font-semibold text-zinc-900">Status tarixçəsi</h2>
      <ol className="mt-5 space-y-4">
        {[...events].reverse().map((event, index) => (
          <li key={event.id} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-zinc-200"
              />
            ) : null}
            <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
            <div>
              <div className="text-sm font-medium text-zinc-900">
                {getEventStatusLabel(event.status)}
              </div>
              {event.note ? (
                <p className="mt-0.5 text-sm text-zinc-600">{event.note}</p>
              ) : null}
              <p className="mt-1 text-xs text-zinc-500">
                {formatDate(event.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
