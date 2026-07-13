import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getOrderStatusLabel,
  getPaymentStatusLabel,
} from "@/lib/checkout/labels";
import { getCustomerOrders } from "@/lib/checkout/queries";
import { formatPrice } from "@/lib/shop/format";
import { getProfile } from "@/lib/auth/session";

export const metadata = {
  title: "Sifarişlərim — BARAKATLY",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OrdersPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect("/signin?next=/orders");
  }

  const orders = await getCustomerOrders();

  return (
    <div className="flex min-h-screen flex-col bg-[#faf9f5]">
      <SiteHeader variant="solid" />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Sifarişlərim
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Keçmiş sifarişlərinizi və ödəniş statusunu izləyin
          </p>

          {orders.length > 0 ? (
            <div className="mt-8 space-y-4">
              {orders.map((order) => {
                const paymentStatus = order.payments?.[0]?.status ?? "pending";

                return (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
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
                          <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                            {getOrderStatusLabel(order.status)}
                          </span>
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                            Ödəniş: {getPaymentStatusLabel(paymentStatus)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
              <p className="text-lg font-medium text-zinc-900">
                Hələ sifarişiniz yoxdur
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                Mağazadan məhsul seçib ilk sifarişinizi verin.
              </p>
              <Link
                href="/shop"
                className="mt-6 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Mağazaya keç
              </Link>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
