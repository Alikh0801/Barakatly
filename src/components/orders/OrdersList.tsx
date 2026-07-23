import Link from "next/link";
import {
  getOrderStatusLabel,
  getOrderStatusTone,
  getPaymentBadgeTone,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { firstPayment } from "@/lib/orders/payment";
import { getCustomerOrders } from "@/lib/checkout/queries";
import { formatPrice, formatUnit, getProductImageUrl } from "@/lib/shop/format";
import { formatDateTime } from "@/lib/format/date";

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
        const paymentStatus =
          firstPayment(order.payments)?.status ?? "pending";
        const items = order.order_items ?? [];
        const itemCount = items.reduce(
          (sum, item) => sum + Number(item.quantity),
          0
        );
        const previewItems = items.slice(0, 3);
        const extraCount = Math.max(0, items.length - previewItems.length);

        return (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            prefetch
            className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md sm:p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-zinc-900">
                  {order.order_code}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {formatDateTime(order.created_at)}
                  {items.length > 0 ? (
                    <span>
                      {" "}
                      · {items.length} məhsul · {itemCount} ədəd
                    </span>
                  ) : null}
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

            {previewItems.length > 0 ? (
              <div className="mt-4 space-y-3 border-t border-zinc-100 pt-4">
                {previewItems.map((item) => {
                  const imageUrl = getProductImageUrl(
                    item.products?.product_images ?? []
                  );
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
                        {imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                            Şəkil
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-900">
                          {item.product_title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          Say: {item.quantity} ·{" "}
                          {formatPrice(item.unit_price)}
                          {formatUnit(item.unit_type)}
                        </p>
                      </div>
                      <div className="shrink-0 text-sm font-medium text-zinc-900">
                        {formatPrice(item.line_total)}
                      </div>
                    </div>
                  );
                })}
                {extraCount > 0 ? (
                  <p className="text-xs font-medium text-emerald-700">
                    +{extraCount} digər məhsul · Detallara bax
                  </p>
                ) : null}
              </div>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
