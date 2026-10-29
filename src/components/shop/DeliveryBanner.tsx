import { DELIVERY_FEE } from "@/lib/checkout/constants";
import { formatPrice } from "@/lib/shop/format";
import { deliveryLabel } from "@/lib/orders/delivery-date";

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-5 w-5">
      <path d="M3 6.5h11v9H3zM14 9.5h3.6l3.4 3.4v2.6h-7" strokeLinejoin="round" />
      <circle cx="7" cy="17.5" r="1.8" />
      <circle cx="17.5" cy="17.5" r="1.8" />
    </svg>
  );
}

/**
 * On the product page: the Sunday an order placed now arrives (see
 * deliveryDateFor). The page renders per request, so "now" is current.
 */
export function DeliveryBanner() {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 ring-1 ring-emerald-100">
      <span className="mt-0.5 shrink-0 text-emerald-700">
        <TruckIcon />
      </span>
      <div>
        <p className="text-sm font-semibold text-emerald-900">
          Bu gün sifariş versəniz, çatdırılma: {deliveryLabel(new Date())}
        </p>
        <p className="mt-0.5 text-xs text-emerald-800">
          Cümə 14:00-dan sonra verilən sifarişlər növbəti bazar günü çatdırılır · Çatdırılma haqqı:{" "}
          {formatPrice(DELIVERY_FEE)}
        </p>
      </div>
    </div>
  );
}
