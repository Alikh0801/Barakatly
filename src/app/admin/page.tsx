import Link from "next/link";
import { getPendingPayments, getAdminOrders } from "@/lib/admin/queries";

export const metadata = {
  title: "Admin — BARAKATLY",
};

export default async function AdminPage() {
  const [payments, orders] = await Promise.all([
    getPendingPayments(),
    getAdminOrders(),
  ]);

  const activeOrders = orders.filter((order) => order.status !== "delivered" && order.status !== "cancelled").length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
        Admin panel
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Ödənişləri təsdiqləyin və sifariş statuslarını idarə edin
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/payments"
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
        >
          <div className="text-sm text-zinc-500">Gözləyən ödənişlər</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">
            {payments.length}
          </div>
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 transition hover:shadow-md"
        >
          <div className="text-sm text-zinc-500">Aktiv sifarişlər</div>
          <div className="mt-2 text-3xl font-semibold text-zinc-900">
            {activeOrders}
          </div>
        </Link>
      </div>
    </div>
  );
}
