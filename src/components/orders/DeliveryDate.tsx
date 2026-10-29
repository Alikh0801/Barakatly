import { deliveryLabel } from "@/lib/orders/delivery-date";

/** "Çatdırılma günü: 1 noyabr, bazar" for an order; nothing for a cancelled one. */
export function DeliveryDate({
  createdAt,
  status,
  className = "",
}: {
  createdAt: string;
  status?: string | null;
  className?: string;
}) {
  if (status === "cancelled") return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-3.5 w-3.5">
        <path d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7" strokeLinejoin="round" />
        <circle cx="7" cy="17.5" r="1.8" />
        <circle cx="17.5" cy="17.5" r="1.8" />
      </svg>
      Çatdırılma günü: {deliveryLabel(createdAt)}
    </span>
  );
}
