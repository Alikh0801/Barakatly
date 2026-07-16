import Link from "next/link";
import { notFound } from "next/navigation";
import { SolidPageShell } from "@/components/layout/SolidPageShell";
import { OrderStatusTracker } from "@/components/orders/OrderStatusTracker";
import { OrderStatusTimeline } from "@/components/orders/OrderStatusTimeline";
import {
  getOrderItemStatusLabel,
  getOrderStatusLabel,
  getOrderStatusTone,
  getPaymentBadgeTone,
  getPaymentStatusLabel,
} from "@/lib/orders/labels";
import { firstPayment } from "@/lib/orders/payment";
import { getOrderById } from "@/lib/checkout/queries";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  return {
    title: order
      ? `${order.order_code} — BARAKATLY`
      : "Sifariş — BARAKATLY",
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const profile = await getProfile();

  if (!profile) {
    notFound();
  }

  const order = await getOrderById(id);
  if (!order) notFound();

  const payment = firstPayment(order.payments);
  const events = order.order_status_events ?? [];
  let receiptSignedUrl: string | null = null;

  if (payment?.receipt_url) {
    const supabase = await createClient();
    const { data } = await supabase.storage
      .from("payment-receipts")
      .createSignedUrl(payment.receipt_url, 3600);
    receiptSignedUrl = data?.signedUrl ?? null;
  }

  return (
    <SolidPageShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
        <Link
          href="/orders"
          prefetch
          className="text-sm font-medium text-emerald-700 hover:underline"
        >
          ← Sifarişlərim
        </Link>

        {query.success === "1" ? (
          <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
            Sifarişiniz qəbul edildi. Ödəniş çeki yoxlanıldıqdan sonra sizə
            bildiriş göndəriləcək.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {order.order_code}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              {formatDate(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={[
                "inline-flex rounded-full px-3 py-1 text-sm font-medium ring-1",
                getOrderStatusTone(order.status),
              ].join(" ")}
            >
              {getOrderStatusLabel(order.status)}
            </span>
            {payment ? (
              <span
                className={[
                  "inline-flex rounded-full px-3 py-1 text-sm font-medium ring-1",
                  getPaymentBadgeTone(payment.status),
                ].join(" ")}
              >
                Ödəniş: {getPaymentStatusLabel(payment.status)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <OrderStatusTracker status={order.status} />
            <OrderStatusTimeline events={events} />

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Məhsullar</h2>
              <div className="mt-4 space-y-4">
                {order.order_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-zinc-900">
                        {item.product_title}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {item.quantity} × {formatPrice(item.unit_price)}
                        {formatUnit(item.unit_type)}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                        {getOrderItemStatusLabel(item.status)}
                      </div>
                    </div>
                    <div className="font-medium text-zinc-900">
                      {formatPrice(item.line_total)}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">
                Çatdırılma məlumatları
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Telefon</dt>
                  <dd className="font-medium text-zinc-900">
                    {order.contact_phone}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Ünvan</dt>
                  <dd className="max-w-xs text-right font-medium text-zinc-900">
                    {order.delivery_address_text ?? "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>

          <aside className="h-fit space-y-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
              <h2 className="text-lg font-semibold text-zinc-900">Xülasə</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-700">
                  <span>Məhsullar</span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>Çatdırılma</span>
                  <span className="font-medium text-zinc-900">
                    {formatPrice(order.delivery_fee)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold text-zinc-900">
                  <span>Cəmi</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>

            {payment ? (
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
                <h2 className="text-lg font-semibold text-zinc-900">Ödəniş</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Bank</dt>
                    <dd className="font-medium text-zinc-900">
                      {payment.banks?.name ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">PAN</dt>
                    <dd className="font-mono font-medium text-zinc-900">
                      {payment.banks?.pan_number ?? "—"}
                    </dd>
                  </div>
                </dl>
                {receiptSignedUrl ? (
                  <a
                    href={receiptSignedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-emerald-700 hover:underline"
                  >
                    Çeki aç
                  </a>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </SolidPageShell>
  );
}
