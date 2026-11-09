import Link from "next/link";
import { ReceiptIcon } from "@/components/app/icons";
import { getCustomerOrders } from "@/lib/checkout/queries";
import { formatDateTime } from "@/lib/format/date";
import { getOrderStatusLabel, getOrderStatusTone } from "@/lib/orders/labels";
import { formatPrice, getProductImageUrl } from "@/lib/shop/format";

/**
 * The installed app's order list (Figma "my-orders"): one card per order
 * with its code, date, status, the first pictures and the total. Statuses
 * and their wording are the website's. App only.
 */
export async function AppOrders() {
  const orders = await getCustomerOrders();

  return (
    <div data-app-screen className="hidden min-h-dvh font-app text-app-ink app:block">
      <h1 className="px-6 pt-4 font-app-display text-[22px] font-bold">Sifarişlərim</h1>

      {orders.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#f3eee2] text-app-green">
            <ReceiptIcon className="h-9 w-9" />
          </span>
          <p className="mt-5 font-app-display text-xl font-bold">Hələ sifarişiniz yoxdur</p>
          <p className="mx-auto mt-2 max-w-xs text-sm text-app-muted">Mağazadan məhsul seçib ilk sifarişinizi verin.</p>
          <Link href="/shop" className="mt-6 inline-flex h-12 items-center rounded-full bg-app-green px-7 text-sm font-bold text-white">
            Mağazaya keç
          </Link>
        </div>
      ) : (
        <ul className="space-y-3 px-6 pt-5 pb-6">
          {orders.map((order) => {
            const items = order.order_items ?? [];
            const pictures = items
              .map((item) => getProductImageUrl(item.products?.product_images ?? []))
              .slice(0, 4);
            const extra = items.length - pictures.length;
            return (
              <li key={order.id}>
                <Link href={`/orders/${order.id}`} data-static-hover className="block rounded-[20px] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-app-display text-base font-bold">#{order.order_code}</p>
                      <p className="mt-0.5 text-xs text-app-muted">
                        {formatDateTime(order.created_at)} · {items.length} məhsul
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${getOrderStatusTone(order.status)}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                  </div>
                  {pictures.length > 0 ? (
                    <div className="mt-3 flex items-center gap-2">
                      {pictures.map((url, index) => (
                        <span key={index} className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#f3eee2]">
                          {url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </span>
                      ))}
                      {extra > 0 ? <span className="text-xs font-semibold text-app-muted">+{extra}</span> : null}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between border-t border-app-line pt-3">
                    <span className="font-app-display text-base font-bold text-[#3b7a2c]">{formatPrice(order.total_amount)}</span>
                    <span className="text-sm font-semibold text-app-green">İzlə ›</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
