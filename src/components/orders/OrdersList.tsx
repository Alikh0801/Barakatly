import Link from "next/link";
import {
  getOrderStatusLabel,
  getOrderStatusTone,
  getPaymentBadgeTone,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { getCustomerOrders } from "@/lib/checkout/queries";
import { formatPrice } from "@/lib/shop/format";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function OrdersList() {
  const orders = await getCustomerOrders();

  if (orders.length === 0) {
    return (
      <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">
          Hələ sifarişiniz yoxdur
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Mağazadan məhsul seçib ilk sifarişinizi verin.
        </p>
        <Link
          href="/shop"
          prefetch
          className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Mağazaya keç
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {orders.map((order) => {
        const paymentStatus = order.payments?.[0]?.status ?? "pending";

        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            prefetch
            className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-zinc-900">
                  {order.order_code}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {formatDate(order.created_at)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-zinc-900">
                  {formatPrice(order.total_amount)}
                </div>
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                      getOrderStatusTone(order.status),
                    ].join(" ")}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <span
                    className={[
                      "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1",
                      getPaymentBadgeTone(paymentStatus),
                    ].join(" ")}
                  >
                    Ödəniş: {getPaymentStatusLabel(paymentStatus)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
